import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { CreateGuestUrlDto, CreateUrlDto, UpdateUrlDto } from './dto/url.dto';
import { Url, UrlDocument } from './schemas/url.schema';

@Injectable()
export class UrlsService {
  constructor(
    @InjectModel(Url.name) private readonly urlModel: Model<UrlDocument>,
  ) {}

  async create(ownerId: string, dto: CreateUrlDto) {
    const shortCode = dto.customCode ?? (await this.generateUniqueShortCode());

    if (dto.customCode && (await this.urlModel.exists({ shortCode }))) {
      throw new ConflictException('This short code is already in use');
    }

    const url = await this.urlModel.create({
      originalUrl: dto.originalUrl,
      title: dto.title,
      shortCode,
      owner: new Types.ObjectId(ownerId),
      isGuest: false,
    });

    return this.toResponse(url);
  }

  async createGuest(dto: CreateGuestUrlDto) {
    const url = await this.urlModel.create({
      originalUrl: dto.originalUrl,
      shortCode: await this.generateUniqueShortCode(),
      isGuest: true,
    });

    return this.toResponse(url);
  }

  async findAllForUser(ownerId: string, page = 1, limit = 20) {
    const ownerObjectId = new Types.ObjectId(ownerId);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * safeLimit;
    const [items, total] = await Promise.all([
      this.urlModel
        .find({ owner: ownerObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.urlModel.countDocuments({ owner: ownerObjectId }),
    ]);

    return {
      items: items.map((url) => this.toResponse(url)),
      page,
      limit: safeLimit,
      total,
    };
  }

  async findOneForUser(id: string, ownerId: string) {
    const url = await this.findOwnedUrl(id, ownerId);
    return this.toResponse(url);
  }

  async update(id: string, ownerId: string, dto: UpdateUrlDto) {
    const url = await this.findOwnedUrl(id, ownerId);
    const { resetClicks, ...updates } = dto;
    Object.assign(url, updates);
    if (resetClicks) {
      url.clicks = 0;
    }
    await url.save();
    return this.toResponse(url);
  }

  async remove(id: string, ownerId: string) {
    const url = await this.findOwnedUrl(id, ownerId);
    await url.deleteOne();
  }

  async removeAsAdmin(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('URL not found');
    }

    const url = await this.urlModel.findById(id).exec();
    if (!url) {
      throw new NotFoundException('URL not found');
    }

    await url.deleteOne();
  }

  async resolve(shortCode: string) {
    const url = await this.urlModel
      .findOne({ shortCode, isActive: true })
      .exec();
    if (!url) {
      throw new NotFoundException('Short URL not found');
    }

    await this.urlModel
      .updateOne({ _id: url._id }, { $inc: { clicks: 1 } })
      .exec();
    return url.originalUrl;
  }

  async findAllForAdmin(page = 1, limit = 50) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * safeLimit;
    const [items, total] = await Promise.all([
      this.urlModel
        .find()
        .populate('owner', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.urlModel.countDocuments(),
    ]);

    return { items, page, limit: safeLimit, total };
  }

  private async findOwnedUrl(id: string, ownerId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('URL not found');
    }

    const url = await this.urlModel.findById(id).exec();
    if (!url) {
      throw new NotFoundException('URL not found');
    }

    if (!url.owner || url.owner.toString() !== ownerId) {
      throw new ForbiddenException('You do not have access to this URL');
    }

    return url;
  }

  private async generateUniqueShortCode() {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = randomBytes(5).toString('base64url').slice(0, 7);
      const exists = await this.urlModel.exists({ shortCode: code });
      if (!exists) {
        return code;
      }
    }

    throw new ConflictException('Unable to generate a unique short code');
  }

  private toResponse(url: UrlDocument) {
    const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:8080';
    return {
      id: url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      shortUrl: `${baseUrl}/api/${url.shortCode}`,
      title: url.title,
      clicks: url.clicks,
      isActive: url.isActive,
      isGuest: url.isGuest,
      createdAt: url.get('createdAt') as Date,
      updatedAt: url.get('updatedAt') as Date,
    };
  }
}
