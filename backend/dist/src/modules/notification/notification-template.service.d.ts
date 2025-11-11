import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../audit/audit.service';
export interface TemplateVariables {
    [key: string]: string | number | boolean;
}
export interface CreateTemplateData {
    name: string;
    description?: string;
    type: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
    subject?: string;
    content: string;
    htmlContent?: string;
    variables?: Record<string, any>;
    language?: string;
    locale?: string;
    event: string;
    module: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    channels?: string[];
    isDefault?: boolean;
}
export interface UpdateTemplateData extends Partial<CreateTemplateData> {
    isActive?: boolean;
}
export declare class NotificationTemplateService {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService);
    createTemplate(templateData: CreateTemplateData, createdBy?: string): Promise<any>;
    updateTemplate(templateId: string, updateData: UpdateTemplateData, updatedBy?: string): Promise<any>;
    deleteTemplate(templateId: string, deletedBy?: string): Promise<void>;
    getTemplate(templateId: string): Promise<any | null>;
    getTemplateByName(name: string): Promise<any | null>;
    getDefaultTemplate(event: string, type: string): Promise<any | null>;
    searchTemplates(filters: {
        type?: string;
        event?: string;
        module?: string;
        language?: string;
        isActive?: boolean;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        templates: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getAvailableEvents(): Promise<Array<{
        event: string;
        module: string;
        description: string;
    }>>;
    getTemplateVariables(event: string, module: string): Promise<Record<string, any>>;
    previewTemplate(templateId: string, variables: TemplateVariables): Promise<{
        subject?: string;
        content: string;
        htmlContent?: string;
    }>;
    cloneTemplate(templateId: string, newName: string, clonedBy?: string): Promise<any>;
    createDefaultTemplates(): Promise<void>;
    private processTemplate;
}
