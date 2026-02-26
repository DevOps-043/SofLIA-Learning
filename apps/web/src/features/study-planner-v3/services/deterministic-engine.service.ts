import { LearningObligation, PolicyVersion, EvaluatedObligation, ComplianceState } from '../types/planner.types';

export class DeterministicPlannerEngine {
  /**
   * Genera un plan de cumplimiento determinista evaluando cada obligación.
   * Totalmente libre de IA ni aleatoriedad. 100% reproducible.
   */
  static generatePlan(
    organizationId: string,
    userId: string,
    obligations: LearningObligation[],
    policyVersion: PolicyVersion
  ): { evaluatedObligations: EvaluatedObligation[] } {
    
    // El motor usa la fecha actual UTC para una evaluación estandarizada
    const evaluationDate = new Date();
    
    // Evaluar estado individual de cada obligación mediante máquina de estados pura
    const evaluatedObligations = obligations.map(obligation => {
      return this.evaluateObligation(obligation, policyVersion, evaluationDate);
    });

    // Validaciones de Multi-Tenant Hardening y Seguridad
    if (evaluatedObligations.some(o => o.organizationId !== organizationId)) {
      throw new Error("Tenant isolation violation: Obligation does not belong to the requested organization.");
    }

    return {
      evaluatedObligations
    };
  }

  /**
   * Función pura para derivar el "Compliance State" sin persistirlo en BD directamente.
   * Reglas de la Especificación Empresarial:
   * - completed: completed_at NOT NULL
   * - waived: exempted_at NOT NULL
   * - overdue: now > hard_due_date + grace_period
   * - due_soon: now > soft_due_date
   * - on_track: default
   */
  static evaluateObligation(
    obligation: LearningObligation, 
    policy: PolicyVersion,
    evaluationDate: Date = new Date()
  ): EvaluatedObligation {
    let state: ComplianceState = 'on_track';
    let daysUntilDue: number | null = null;
    
    // 1. Estados Finales (Derivación explícita)
    if (obligation.completedAt) {
      return { ...obligation, complianceState: 'completed', daysUntilDue };
    }
    
    if (obligation.exemptedAt) {
      return { ...obligation, complianceState: 'waived', daysUntilDue };
    }

    // 2. Cálculos precisos de tiempo (Ignorando horas para cálculo estricto de días)
    const hardDueDate = new Date(obligation.hardDueDate);
    hardDueDate.setHours(0, 0, 0, 0);

    const evalDateZero = new Date(evaluationDate);
    evalDateZero.setHours(0, 0, 0, 0);

    // Los días restantes se calculan siempre respecto al límite original que ve el usuario
    const diffTimeToDue = hardDueDate.getTime() - evalDateZero.getTime();
    daysUntilDue = Math.ceil(diffTimeToDue / (1000 * 60 * 60 * 24));

    const gracePeriodMs = (obligation.gracePeriodDays ?? policy.rules.defaultGracePeriodDays ?? 0) * 24 * 60 * 60 * 1000;
    
    // Absolute deadline es el último milisegundo permitido por RRHH antes de marcar "incumplimiento"
    const absoluteDeadline = new Date(hardDueDate.getTime() + gracePeriodMs);

    // 3. Resolución del estado temporal
    if (evaluationDate > absoluteDeadline) {
      state = 'overdue';
    } 
    else if (obligation.softDueDate && evaluationDate > new Date(obligation.softDueDate)) {
      state = 'due_soon';
    } 
    else if (daysUntilDue <= (policy.rules.dueSoonThresholdDays ?? 7)) {
       // Fallback a threshold si softDueDate es null pero se acerca el hardDueDate
      state = 'due_soon';
    }

    return {
      ...obligation,
      complianceState: state,
      daysUntilDue
    };
  }
}
