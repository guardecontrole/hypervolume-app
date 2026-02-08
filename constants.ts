import { Exercise, PeriodizationPhase } from './types';

export const PERIODIZATION_PHASES: PeriodizationPhase[] = [
    { 
        id: 'f0_adaptacao', 
        name: 'Fase 0: Adaptação Anatômica', 
        stage: 'INÍCIO', 
        rirTarget: 3, 
        progressionRule: 'technique', 
        tensionalRatio: 0.2, 
        targetVolumeStatus: 'MANUTENÇÃO',
        description: 'Foco total em técnica e consciência corporal. Mantenha o volume baixo (Manutenção) para permitir adaptações tendíneas sem estresse inflamatório excessivo.' 
    },
    { 
        id: 'fr_retorno', 
        name: 'Fase R: Retorno e Readaptação', 
        stage: 'INÍCIO', 
        rirTarget: 4, 
        progressionRule: 'technique', 
        tensionalRatio: 0.3, 
        targetVolumeStatus: 'MANUTENÇÃO',
        description: 'Readaptação de Cargas. O foco é recuperar o ritmo. Volume de manutenção é suficiente para sinalizar o retorno da síntese proteica.' 
    },
    { 
        id: 'f_manual', 
        name: 'Fase M: Controle Manual', 
        stage: 'INÍCIO', 
        rirTarget: 1, 
        progressionRule: 'mixed', 
        tensionalRatio: 0.5, 
        targetVolumeStatus: 'QUALQUER',
        description: 'Personalização Livre. Você define seus próprios limites e alvos de volume conforme sua percepção de esforço.' 
    },
    { 
        id: 'f1_acumulacao', 
        name: 'Fase 1: Acumulação', 
        stage: 'FORÇA', 
        rirTarget: 2, 
        progressionRule: 'volume', 
        tensionalRatio: 0.4, 
        targetVolumeStatus: 'OTIMIZADO',
        description: 'Construção de Volume. Aqui ignoramos o status de manutenção. O objetivo é empurrar o volume de Produtivo para Otimizado semana a semana.' 
    },
    { 
        id: 'f2_intensificacao', 
        name: 'Fase 2: Intensificação', 
        stage: 'FORÇA', 
        rirTarget: 1, 
        progressionRule: 'load', 
        tensionalRatio: 0.7, 
        targetVolumeStatus: 'PRODUTIVO',
        description: 'Foco em Carga Mecânica. Como a carga sobe muito, reduzimos o volume para a faixa Produtiva para garantir a integridade do SNC.' 
    },
    { id: 'f3_realizacao', name: 'Fase 3: Realização', stage: 'REALIZAÇÃO', rirTarget: 0, progressionRule: 'mixed', tensionalRatio: 0.8, targetVolumeStatus: 'LIMITE', description: 'Pico de performance. O volume atinge o limite máximo (Choque) seguido por um tapering agressivo.' },
    { 
        id: 'm5_falsa_piramide', 
        name: 'Meso 1: Falsa Pirâmide', 
        stage: 'HIPERTROFIA', 
        rirTarget: 0, 
        progressionRule: 'mixed', 
        tensionalRatio: 0.4, 
        targetVolumeStatus: 'OTIMIZADO',
        description: 'Técnica de Falsa Pirâmide. Volume alto e repetições decrescentes para gerar estresse metabólico profundo.' 
    },
    { 
        id: 'm6_o_pico', 
        name: 'Meso 2: O Pico (Overreaching)', 
        stage: 'HIPERTROFIA', 
        rirTarget: 0, 
        progressionRule: 'volume', 
        tensionalRatio: 0.3, 
        targetVolumeStatus: 'LIMITE',
        description: 'O estágio final. Aumento de frequência e volume no limite da recuperação. Busque o esgotamento total das reservas de glicogênio.' 
    },
    { id: 'm1_volume_base', name: 'Meso 1: Volume Base', stage: 'RESISTÊNCIA', rirTarget: 1, progressionRule: 'load', tensionalRatio: 0.4, targetVolumeStatus: 'PRODUTIVO', description: 'Trabalho sólido em hipertrofia crônica.' },
    { id: 'm2_prog_reps', name: 'Meso 2: Progressão Reps', stage: 'RESISTÊNCIA', rirTarget: 1, progressionRule: 'reps', tensionalRatio: 0.4, targetVolumeStatus: 'OTIMIZADO', description: 'Estratégia de Dupla Progressão: Mantenha o peso fixo e aumente as repetições (8 -> 12). Só aumente a carga se ultrapassar 12 repetições na S4.' },
    { id: 'm3_drop_sets', name: 'Meso 3: Drop Sets', stage: 'RESISTÊNCIA', rirTarget: 0, progressionRule: 'mixed', tensionalRatio: 0.4, targetVolumeStatus: 'LIMITE', description: 'Lógica Híbrida: Top/Back-off para Tensionais e Drop Set na última série para Metabólicos/Máquinas.' },
    { 
        id: 'm4_ondulatoria', 
        name: 'Meso 4: Ondulatória (Super Sets)', 
        stage: 'RESISTÊNCIA', 
        rirTarget: 1, 
        progressionRule: 'mixed', 
        tensionalRatio: 0.4, 
        targetVolumeStatus: 'OTIMIZADO',
        description: 'Periodização Ondulante: Manutenção de força nos compostos (Top/Back-off) e estresse metabólico nas máquinas via Super Sets.' 
    },
];

export const PREDEFINED_EXERCISES: Exercise[] = [
    // --- PEITO ---
    { name: "Supino Reto", isCompound: true, isGuided: false, muscles: [{ name: "Peito", type: "principal", contribution: 1.0 }, { name: "Tríceps", type: "sinergista", contribution: 0.25 }, { name: "Ombros (Deltoides Anteriores)", type: "sinergista", contribution: 0.33 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.20 }] },
    { name: "Supino Inclinado com barra", isCompound: true, isGuided: false, muscles: [{ name: "Peito", type: "principal", contribution: 1.0 }, { name: "Ombros (Deltoides Anteriores)", type: "sinergista", contribution: 0.50 }, { name: "Tríceps", type: "sinergista", contribution: 0.40 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.20 }] },
    { name: "Crucifixo with Halteres", isCompound: false, isGuided: false, muscles: [{ name: "Peito", type: "principal", contribution: 1.0 }, { name: "Ombros (Deltoides Anteriores)", type: "sinergista", contribution: 0.20 }] },
    { name: "Flexão de Braço", isCompound: true, isGuided: false, muscles: [{ name: "Peito", type: "principal", contribution: 1.0 }, { name: "Tríceps", type: "sinergista", contribution: 0.45 }, { name: "Ombros (Deltoides Anteriores)", type: "sinergista", contribution: 0.25 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.30 }] },
    { name: "Paralelas", isCompound: true, isGuided: false, muscles: [{ name: "Tríceps", type: "principal", contribution: 1.0 }, { name: "Peito", type: "principal", contribution: 0.60 }, { name: "Ombros (Deltoides Anteriores)", type: "sinergista", contribution: 0.25 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.20 }] },
    { name: "Crucifixo na Maquina com Braços Estendidos", isCompound: false, isGuided: true, muscles: [{ name: "Peito", type: "principal", contribution: 1.0 }, { name: "Ombros (Deltoides Anteriores)", type: "sinergista", contribution: 0.20 }, { name: "Bíceps", type: "sinergista", contribution: 0.10 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.10 }] },
    { name: "Supino Maquina com pegada Martelo", isCompound: true, isGuided: true, muscles: [{ name: "Peito", type: "principal", contribution: 1.0 }, { name: "Tríceps", type: "sinergista", contribution: 0.35 }, { name: "Ombros (Deltoides Anteriores)", type: "sinergista", contribution: 0.20 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.10 }] },
    { name: "Supino Maquina", isCompound: true, isGuided: true, muscles: [{ name: "Peito", type: "principal", contribution: 1.0 }, { name: "Tríceps", type: "sinergista", contribution: 0.40 }, { name: "Ombros (Deltoiores Anteriores)", type: "sinergista", contribution: 0.20 }] },

    // --- COSTAS ---
    { name: "Remada Curvada com barra", isCompound: true, isGuided: false, muscles: [{ name: "Costas (Grande Dorsal)", type: "principal", contribution: 1.0 }, { name: "Bíceps", type: "sinergista", contribution: 0.45 }, { name: "Trapézio", type: "sinergista", contribution: 0.35 }, { name: "Ombros (Deltoides Posteriores)", type: "sinergista", contribution: 0.30 }, { name: "Lombar", type: "sinergista", contribution: 0.40 }] },
    { name: "Puxada Alta (Lat Pulldown)", isCompound: true, isGuided: true, muscles: [{ name: "Costas (Grande Dorsal)", type: "principal", contribution: 1.0 }, { name: "Bíceps", type: "sinergista", contribution: 0.50 }] },
    { name: "Remada Cavalinho", isCompound: true, isGuided: false, muscles: [{ name: "Costas (Grande Dorsal)", type: "principal", contribution: 1.0 }, { name: "Bíceps", type: "sinergista", contribution: 0.40 }, { name: "Ombros (Deltoides Posteriores)", type: "sinergista", contribution: 0.35 }, { name: "Trapézio", type: "sinergista", contribution: 0.30 }] },
    { name: "Pulldown", isCompound: false, isGuided: true, muscles: [{ name: "Costas (Grande Dorsal)", type: "principal", contribution: 1.0 }, { name: "Bíceps", type: "sinergista", contribution: 0.10 }, { name: "Braquial", type: "sinergista", contribution: 0.10 }, { name: "Trapézio", type: "sinergista", contribution: 0.10 }] },
    { name: "Barras na Máquina com Suporte", isCompound: true, isGuided: true, muscles: [{ name: "Costas (Grande Dorsal)", type: "principal", contribution: 1.0 }, { name: "Bíceps", type: "sinergista", contribution: 0.50 }, { name: "Braquial", type: "sinergista", contribution: 0.20 }, { name: "Trapézio", type: "sinergista", contribution: 0.20 }] },
    { name: "Puxada Unilateral com Pegada Martelo", isCompound: true, isGuided: true, muscles: [{ name: "Costas (Grande Dorsal)", type: "principal", contribution: 1.0 }, { name: "Braquial", type: "sinergista", contribution: 0.30 }, { name: "Bíceps", type: "sinergista", contribution: 0.30 }, { name: "Trapézio", type: "sinergista", contribution: 0.20 }] },
    { name: "Remada com Halteres no Banco Alto", isCompound: true, isGuided: false, muscles: [{ name: "Costas (Grande Dorsal)", type: "principal", contribution: 1.0 }, { name: "Trapézio", type: "sinergista", contribution: 0.40 }, { name: "Bíceps", type: "sinergista", contribution: 0.30 }, { name: "Braquial", type: "sinergista", contribution: 0.20 }] },
    { name: "Puxada Vertical até o Peito", isCompound: true, isGuided: true, muscles: [{ name: "Costas (Grande Dorsal)", type: "principal", contribution: 1.0 }, { name: "Bíceps", type: "sinergista", contribution: 0.50 }, { name: "Braquial", type: "sinergista", contribution: 0.30 }, { name: "Trapézio", type: "sinergista", contribution: 0.20 }] },
    { name: "Hack Pull", isCompound: true, isGuided: true, muscles: [{ name: "Lombar", type: "principal", contribution: 1.0 }, { name: "Glúteos", type: "sinergista", contribution: 0.60 }, { name: "Isquiotibiais", type: "sinergista", contribution: 0.40 }, { name: "Trapézio", type: "sinergista", contribution: 0.40 }, { name: "Antebraço", type: "sinergista", contribution: 0.40 }] },
    { name: "Pull Down Unilateral", isCompound: false, isGuided: true, muscles: [{ name: "Costas (Grande Dorsal)", type: "principal", contribution: 1.0 }, { name: "Trapézio", type: "sinergista", contribution: 0.10 }, { name: "Bíceps", type: "sinergista", contribution: 0.10 }, { name: "Braquial", type: "sinergista", contribution: 0.10 }] },
    { name: "Remada Alta na Polia", isCompound: true, isGuided: true, muscles: [{ name: "Trapézio", type: "principal", contribution: 1.0 }, { name: "Ombros (Deltoides Laterais)", type: "sinergista", contribution: 0.60 }, { name: "Antebraço", type: "sinergista", contribution: 0.30 }] },

    // --- OMBROS ---
    { name: "Desenvolvimento com Halteres", isCompound: true, isGuided: false, muscles: [{ name: "Ombros (Deltoides Anteriores)", type: "principal", contribution: 1.0 }, { name: "Ombros (Deltoides Laterais)", type: "sinergista", contribution: 0.50 }, { name: "Tríceps", type: "sinergista", contribution: 0.40 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.30 }] },
    { name: "Desenvolvimento de Ombros na Máquina (sentado)", isCompound: true, isGuided: true, muscles: [{ name: "Ombros (Deltoides Anteriores)", type: "principal", contribution: 1.0 }, { name: "Ombros (Deltoides Laterais)", type: "sinergista", contribution: 0.40 }, { name: "Tríceps", type: "sinergista", contribution: 0.40 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.10 }] },
    { name: "Elevação Lateral", isCompound: false, isGuided: false, muscles: [{ name: "Ombros (Deltoides Laterais)", type: "principal", contribution: 1.0 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.10 }] },
    { name: "Elevação Lateral na Máquina (sentado)", isCompound: false, isGuided: true, muscles: [{ name: "Ombros (Deltoides Laterais)", type: "principal", contribution: 1.0 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.05 }, { name: "Trapézio", type: "sinergista", contribution: 0.10 }] },
    { name: "Elevação frontal com halteres", isCompound: false, isGuided: false, muscles: [{ name: "Ombros (Deltoides Anteriores)", type: "principal", contribution: 1.0 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.10 }] },
    { name: "Remada alta com barra", isCompound: true, isGuided: false, muscles: [{ name: "Ombros (Deltoides Laterais)", type: "principal", contribution: 1.0 }, { name: "Trapézio", type: "principal", contribution: 0.80 }, { name: "Bíceps", type: "sinergista", contribution: 0.40 }, { name: "Antebraço", type: "sinergista", contribution: 0.30 }] },
    { name: "Desenvolvimento de Ombros com Barra", isCompound: true, isGuided: false, muscles: [{ name: "Ombros (Deltoides Anteriores)", type: "principal", contribution: 1.0 }, { name: "Ombros (Deltoides Laterais)", type: "sinergista", contribution: 0.40 }, { name: "Trapézio", type: "sinergista", contribution: 0.30 }, { name: "Tríceps", type: "sinergista", contribution: 0.40 }] },
    { name: "Elevação Lateral com Haltere no banco inclinado", isCompound: false, isGuided: false, muscles: [{ name: "Ombros (Deltoides Laterais)", type: "principal", contribution: 1.0 }, { name: "Ombros (Deltoides Posteriores)", type: "sinergista", contribution: 0.30 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.20 }] },
    { name: "Crucifixo Inverso na Maquina", isCompound: false, isGuided: true, muscles: [{ name: "Ombros (Deltoides Posteriores)", type: "principal", contribution: 1.0 }, { name: "Trapézio", type: "sinergista", contribution: 0.30 }] },
    { name: "Facepull", isCompound: true, isGuided: true, muscles: [{ name: "Trapézio", type: "principal", contribution: 1.0 }, { name: "Ombros (Deltoides Posteriores)", type: "sinergista", contribution: 0.80 }, { name: "Ombros (Estabilização)", type: "sinergista", contribution: 0.40 }] },

    // --- TRÍCEPS ---
    { name: "Tríceps Testa", isCompound: false, isGuided: false, muscles: [{ name: "Tríceps", type: "principal", contribution: 1.0 }, { name: "Antebraço", type: "sinergista", contribution: 0.15 }] },
    { name: "Puxador Triceps com Corda", isCompound: false, isGuided: true, muscles: [{ name: "Tríceps", type: "principal", contribution: 1.0 }, { name: "Ombros (Deltoides Posteriores)", type: "sinergista", contribution: 0.10 }, { name: "Trapézio", type: "sinergista", contribution: 0.10 }] },
    { name: "Puxada Triceps Sobre a Cabeça com Corda (Inclinado)", isCompound: false, isGuided: true, muscles: [{ name: "Tríceps", type: "principal", contribution: 1.0 }, { name: "Abdômen", type: "sinergista", contribution: 0.20 }, { name: "Ombros (Estabilização)", type: "sinergista", contribution: 0.20 }] },
    { name: "Triceps na Maquina (Sentado)", isCompound: true, isGuided: true, muscles: [{ name: "Tríceps", type: "principal", contribution: 1.0 }, { name: "Peito", type: "sinergista", contribution: 0.20 }, { name: "Ombros (Deltoiores Anteriores)", type: "sinergista", contribution: 0.20 }] },
    { name: "Puxador Triceps em pé", isCompound: false, isGuided: true, muscles: [{ name: "Tríceps", type: "principal", contribution: 1.0 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.10 }] },
    { name: "Coice com Haltere", isCompound: false, isGuided: false, muscles: [{ name: "Tríceps", type: "principal", contribution: 1.0 }, { name: "Ombros (Deltoides Posteriores)", type: "sinergista", contribution: 0.15 }] },
    { name: "Triceps Com Barra sobre a Cabeça (Sentado)", isCompound: false, isGuided: false, muscles: [{ name: "Tríceps", type: "principal", contribution: 1.0 }, { name: "Abdômen", type: "sinergista", contribution: 0.15 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.15 }] },

    // --- BÍCEPS ---
    { name: "Rosca Direta", isCompound: false, isGuided: false, muscles: [{ name: "Bíceps", type: "principal", contribution: 1.0 }, { name: "Antebraço", type: "sinergista", contribution: 0.20 }] },
    { name: "Rosca Direta com Halteres", isCompound: false, isGuided: false, muscles: [{ name: "Bíceps", type: "principal", contribution: 1.0 }, { name: "Braquial", type: "sinergista", contribution: 0.40 }, { name: "Antebraço", type: "sinergista", contribution: 0.20 }] },
    { name: "Rosca Direta com Barra Inclinado", isCompound: false, isGuided: false, muscles: [{ name: "Bíceps", type: "principal", contribution: 1.0 }, { name: "Braquial", type: "sinergista", contribution: 0.30 }, { name: "Antebraço", type: "sinergista", contribution: 0.20 }] },
    { name: "Rosca Na maquina Sentado", isCompound: false, isGuided: true, muscles: [{ name: "Bíceps", type: "principal", contribution: 1.0 }, { name: "Braquial", type: "sinergista", contribution: 0.20 }, { name: "Antebraço", type: "sinergista", contribution: 0.10 }] },

    // --- PERNAS ---
    { name: "Agachamento Livre", isCompound: true, isGuided: false, muscles: [{ name: "Quadríceps", type: "principal", contribution: 1.0 }, { name: "Glúteos", type: "principal", contribution: 0.80 }, { name: "Isquiotibiais", type: "sinergista", contribution: 0.40 }, { name: "Lombar", type: "sinergista", contribution: 0.40 }, { name: "Abdômen", type: "sinergista", contribution: 0.30 }, { name: "Panturrilhas", type: "sinergista", contribution: 0.20 }] },
    { name: "Levantamento Terra (Deadlift)", isCompound: true, isGuided: false, muscles: [{ name: "Isquiotibiais", type: "principal", contribution: 1.0 }, { name: "Glúteos", type: "principal", contribution: 1.0 }, { name: "Lombar", type: "principal", contribution: 0.80 }, { name: "Trapézio", type: "sinergista", contribution: 0.60 }, { name: "Antebraço", type: "sinergista", contribution: 0.50 }, { name: "Abdômen", type: "sinergista", contribution: 0.40 }, { name: "Costas (Grande Dorsal)", type: "sinergista", contribution: 0.30 }] },
    { name: "Stiff com barra", isCompound: true, isGuided: false, muscles: [{ name: "Isquiotibiais", type: "principal", contribution: 1.0 }, { name: "Glúteos", type: "principal", contribution: 0.80 }, { name: "Lombar", type: "sinergista", contribution: 0.60 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.30 }] },
    { name: "Leg Press", isCompound: true, isGuided: true, muscles: [{ name: "Quadríceps", type: "principal", contribution: 1.0 }, { name: "Glúteos", type: "principal", contribution: 0.70 }, { name: "Isquiotibiais", type: "sinergista", contribution: 0.40 }, { name: "Panturrilhas", type: "sinergista", contribution: 0.20 }] },
    { name: "Cadeira Extensora", isCompound: false, isGuided: true, muscles: [{ name: "Quadríceps", type: "principal", contribution: 1.0 }] },
    { name: "Cadeira Flexora", isCompound: false, isGuided: true, muscles: [{ name: "Isquiotibiais", type: "principal", contribution: 1.0 }] },
    { name: "Flexão de Pernas na Máquina (sentado)", isCompound: false, isGuided: true, muscles: [{ name: "Isquiotibiais", type: "principal", contribution: 1.0 }, { name: "Panturrilhas", type: "sinergista", contribution: 0.20 }] },
    { name: "Panturrilha em Pé", isCompound: false, isGuided: false, muscles: [{ name: "Panturrilhas", type: "principal", contribution: 1.0 }] },
    { name: "Mesa Flexora", isCompound: false, isGuided: true, muscles: [{ name: "Isquiotibiais", type: "principal", contribution: 1.0 }, { name: "Panturrilhas", type: "sinergista", contribution: 0.30 }, { name: "Glúteos", type: "sinergista", contribution: 0.20 }] },
    { name: "Panturrilha sentado na Maquina", isCompound: false, isGuided: true, muscles: [{ name: "Panturrilhas", type: "principal", contribution: 1.0 }] },
    { name: "Panturrilha em pé na Maquina", isCompound: false, isGuided: true, muscles: [{ name: "Panturrilhas", type: "principal", contribution: 1.0 }] },
    { name: "Panturrilha em pé no Smith", isCompound: false, isGuided: true, muscles: [{ name: "Panturrilhas", type: "principal", contribution: 1.0 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.20 }] },
    { name: "Maquina de Hipertenssões", isCompound: false, isGuided: true, muscles: [{ name: "Lombar", type: "principal", contribution: 1.0 }, { name: "Glúteos", type: "sinergista", contribution: 0.60 }, { name: "Isquiotibiais", type: "sinergista", contribution: 0.60 }] },

    // --- CORE ---
    { name: "Abdominal Tradicional", isCompound: false, isGuided: false, muscles: [{ name: "Abdômen", type: "principal", contribution: 1.0 }, { name: "Lombar", type: "sinergista", contribution: 0.10 }] },
    { name: "Prancha (isometria)", isCompound: false, isGuided: false, muscles: [{ name: "Abdômen", type: "principal", contribution: 1.0 }, { name: "Lombar", type: "sinergista", contribution: 0.60 }, { name: "Glúteos", type: "sinergista", contribution: 0.40 }, { name: "Ombros (Estabilização)", type: "sinergista", contribution: 0.40 }, { name: "Estabilizadores", type: "sinergista", contribution: 0.50 }] },
    { name: "Abdominais no banco (Declinado)", isCompound: false, isGuided: false, muscles: [{ name: "Abdômen", type: "principal", contribution: 1.0 }, { name: "Quadríceps", type: "sinergista", contribution: 0.40 }] },
    { name: "Abdominal Obliquo Unilateral", isCompound: false, isGuided: false, muscles: [{ name: "Abdômen", type: "principal", contribution: 1.0 }, { name: "Lombar", type: "sinergista", contribution: 0.20 }] }
];

export const SECONDARY_MUSCLES = ["Antebraço", "Estabilizadores", "Ombros (Estabilização)", "Braquial"];
export const MUSCLE_SORT_ORDER = ["Peito", "Costas (Grande Dorsal)", "Trapézio", "Lombar", "Ombros (Deltoides Anteriores)", "Ombros (Deltoides Laterais)", "Ombros (Deltoides Posteriores)", "Tríceps", "Bíceps", "Quadríceps", "Isquiotibiais", "Adutores", "Glúteos", "Panturrilhas", "Abdômen", "Antebraço", "Estabilizadores", "Ombros (Estabilização)", "Braquial"];
export const EXERCISE_CATEGORIES = { 
    "Peito": ["Peito"], 
    "Costas": ["Costas (Grande Dorsal)", "Trapézio"], 
    "Ombros": ["Ombros (Deltoides Anteriores)", "Ombros (Deltoides Laterais)", "Ombros (Deltoides Posteriores)", "Trapézio"], 
    "Braços": ["Bíceps", "Tríceps", "Antebraço", "Braquial"], 
    "Pernas": ["Quadríceps", "Isquiotibiais", "Glúteos", "Panturrilhas", "Adutores"], 
    "Core": ["Abdômen", "Lombar"] 
};
export const CATEGORY_ORDER = ["Peito", "Costas", "Ombros", "Braços", "Pernas", "Core", "Outros"];
export const MUSCULOS_GRANDES = ["Peito", "Costas (Grande Dorsal)", "Quadríceps", "Glúteos", "Isquiotibiais"];
export const DAYS_OF_WEEK = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];