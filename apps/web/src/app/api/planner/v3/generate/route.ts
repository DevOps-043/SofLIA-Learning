import { NextResponse } from 'next/server';
import { DeterministicPlannerEngine } from '../../../../../features/study-planner-v3/services/deterministic-engine.service';
import { GeneratePlanRequest } from '../../../../../features/study-planner-v3/types/planner.types';

export async function POST(req: Request) {
  try {
    // 1. Leer el JSON del input
    const body: GeneratePlanRequest = await req.json();
    const { organizationId, userId, obligations, policyVersion } = body;
    
    // 2. Validaciones Críticas (Hardening)
    if (!organizationId || !userId || !obligations || !policyVersion) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required deterministic inputs (organizationId, userId, obligations, policyVersion)' 
      }, { status: 400 });
    }

    // Opcional: Aquí se comprobaría feature flag: planner_v3_generate_enabled desde base de datos.
    
    // 3. Ejecución del Motor Determinista B2B (Cálculo Síncrono Libre de IA)
    // SLA Objetivo: < 500ms
    const startTime = performance.now();
    
    const result = DeterministicPlannerEngine.generatePlan(
      organizationId,
      userId,
      obligations,
      policyVersion
    );

    const executionTime = performance.now() - startTime;

    // 4. Retornar Estado de Cumplimiento Calculado Exacto (Reproducible)
    return NextResponse.json({
      success: true,
      meta: {
        executionTimeMs: Math.round(executionTime),
        evaluationPolicy: policyVersion.id,
        timestamp: new Date().toISOString()
      },
      data: result
    });

  } catch (error: any) {
    console.error('Â¡Critical Planner V3 Generate Error!:', error);
    
    // Fallback seguro ante error (Prevenir leak multi-tenant si este fallÃ³)
    if (error.message && error.message.includes('Tenant isolation')) {
      return NextResponse.json({ success: false, error: 'Security Exception: Multi-tenant violation' }, { status: 403 });
    }

    return NextResponse.json({ success: false, error: 'Internal Server Error during deterministic generation' }, { status: 500 });
  }
}
