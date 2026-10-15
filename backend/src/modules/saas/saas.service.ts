import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  TenantProvisioningService,
  CreateTenantDto,
} from './tenant-provisioning.service.js';

export interface SaasPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  limits: {
    maxBranches: number | 'Ilimitadas';
    maxProducts: number | 'Ilimitados';
    maxUsers: number | 'Ilimitados';
    storage: string;
  };
  features: string[];
  cta: string;
}

@Injectable()
export class SaasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provisioningService: TenantProvisioningService,
  ) {}

  getPlans(): SaasPlan[] {
    return [
      {
        id: 'STARTER',
        name: 'Starter Boutique',
        tagline: 'Para boutiques independientes y marcas emergentes de moda',
        monthlyPrice: 29,
        annualPrice: 24,
        popular: false,
        limits: {
          maxBranches: 1,
          maxProducts: 500,
          maxUsers: 2,
          storage: '5 GB',
        },
        features: [
          '1 Sucursal física + Tienda Online',
          'Catálogo de hasta 500 prendas y variantes',
          'Punto de Venta (POS) en mostrador',
          'Modo Offline para POS con sincronización',
          'Cobro con Stripe, Tarjetas y QR',
          'Gestión básica de inventario',
          'Soporte estándar por email en 24h',
        ],
        cta: 'Empezar con Starter',
      },
      {
        id: 'PRO',
        name: 'Pro Crecimiento',
        tagline: 'Para marcas en expansión, franquicias y boutiques de alto volumen',
        monthlyPrice: 79,
        annualPrice: 63,
        popular: true,
        limits: {
          maxBranches: 5,
          maxProducts: 'Ilimitados',
          maxUsers: 'Ilimitados',
          storage: '50 GB',
        },
        features: [
          'Hasta 5 Sucursales y Almacenes centrales',
          'Productos y variantes ilimitadas',
          'Probador Físico Inteligente (Reserva web)',
          'Probador Virtual e IA Estilista de medidas',
          'Kardex y Traslados de stock entre sucursales',
          'Multi-caja y perfiles de usuarios ilimitados',
          'Módulo de promociones y cupones de temporada',
          'Soporte prioritario por WhatsApp & Chat',
        ],
        cta: 'Probar Gratis 14 Días',
      },
      {
        id: 'ENTERPRISE',
        name: 'Enterprise Omnichannel',
        tagline: 'Para cadenas departamentales, marcas globales y alta escala retail',
        monthlyPrice: 199,
        annualPrice: 159,
        popular: false,
        limits: {
          maxBranches: 'Ilimitadas',
          maxProducts: 'Ilimitados',
          maxUsers: 'Ilimitados',
          storage: '500 GB',
        },
        features: [
          'Sucursales y Depósitos logísticos ilimitados',
          'Dominio web personalizado (ej. tu-marca.com)',
          'Reportes Inteligentes por Voz con IA (Whisper)',
          'Text-to-SQL Analytics con ReportIQ',
          'Esquema PostgreSQL aislado de alta disponibilidad',
          'SLA de 99.9% y respaldos automáticos diarios',
          'Onboarding asistido y capacitación al personal',
          'Gerente de cuenta técnico dedicado 24/7',
        ],
        cta: 'Contactar a Ventas',
      },
    ];
  }

  async registerTenant(dto: CreateTenantDto) {
    return this.provisioningService.createTenant(dto);
  }

  async getAllTenants() {
    return this.prisma.publicClient.tenant.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        ownerName: true,
        primaryColor: true,
        logoUrl: true,
        settings: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTenantBySlug(slug: string) {
    const tenant = await this.prisma.publicClient.tenant.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (!tenant) {
      throw new NotFoundException(`La tienda "${slug}" no fue encontrada.`);
    }

    return tenant;
  }

  async getPlatformStats() {
    const totalTenants = await this.prisma.publicClient.tenant.count({
      where: { status: 'ACTIVE' },
    });

    return {
      totalStores: totalTenants,
      activePlans: {
        starter: await this.prisma.publicClient.tenant.count({
          where: { plan: 'STARTER' },
        }),
        pro: await this.prisma.publicClient.tenant.count({
          where: { plan: 'PRO' },
        }),
        enterprise: await this.prisma.publicClient.tenant.count({
          where: { plan: 'ENTERPRISE' },
        }),
      },
      uptime: '99.98%',
      multitenancyMode: 'Schema-Based (PostgreSQL isolated schemas per store)',
      version: '2.5.0-cloud',
    };
  }
}
