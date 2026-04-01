export const LEGAL_POLICY_VERSION = "2026-04-01";
export const LEGAL_TERMS_VERSION = "2026-04-01";

export type LegalSection = {
  title: string;
  body: string[];
};

export type LegalDocumentContent = {
  title: string;
  shortTitle: string;
  version: string;
  updatedAtLabel: string;
  intro: string[];
  sections: LegalSection[];
};

export const PRIVACY_POLICY_CONTENT: LegalDocumentContent = {
  title: "Política de Privacidade",
  shortTitle: "Política de Privacidade",
  version: LEGAL_POLICY_VERSION,
  updatedAtLabel: "Última atualização: 01 de abril de 2026",
  intro: [
    "A AMA da Favela respeita a privacidade, a proteção de dados pessoais e a autodeterminação informativa de seus usuários. Esta Política de Privacidade descreve, de forma clara e formal, como coletamos, utilizamos, armazenamos, protegemos e compartilhamos informações no contexto da utilização de nossa plataforma digital, incluindo website, aplicativo móvel, funcionalidades administrativas, documentos emitidos e serviços correlatos.",
    "Ao acessar, navegar, cadastrar-se ou utilizar quaisquer funcionalidades da plataforma, o usuário declara ciência desta Política e concorda com o tratamento de dados pessoais nela descrito, nos limites permitidos pela legislação aplicável, em especial a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais – LGPD), o Marco Civil da Internet e demais normas brasileiras aplicáveis.",
  ],
  sections: [
    {
      title: "1. Controladora e escopo",
      body: [
        "A plataforma AMA da Favela atua como controladora dos dados pessoais tratados no âmbito de seus serviços, podendo, em situações específicas, atuar em conjunto com associações, parceiros institucionais, prestadores de serviços, operadores tecnológicos e demais agentes vinculados à operação da aplicação.",
        "Esta Política aplica-se a todos os usuários, visitantes, administradores, colaboradores, representantes de associações, parceiros e demais pessoas que utilizem, acessem ou interajam com a plataforma por qualquer canal digital sob nossa gestão.",
      ],
    },
    {
      title: "2. Dados pessoais coletados",
      body: [
        "Podemos coletar dados fornecidos diretamente pelo usuário, incluindo, sem limitação: nome completo, CPF, data de nascimento, endereço, complemento, CEP, telefone, e-mail, foto de perfil, comunidade vinculada, dados cadastrais de associação e demais informações inseridas voluntariamente em formulários, cadastros, publicações, solicitações e áreas internas da aplicação.",
        "Também coletamos dados gerados automaticamente durante o uso da plataforma, tais como: endereço IP, identificadores de dispositivo, tipo e versão do navegador, sistema operacional, idioma, resolução de tela, informações de sessão, data e hora de acesso, páginas visitadas, cliques, eventos de navegação, tempo de permanência, rotas acessadas, falhas, exceções, erros de sistema, dados de desempenho, logs técnicos, origem de tráfego, preferências de uso e metadados operacionais.",
        "Em ambientes web e mobile, poderemos utilizar mecanismos de telemetria, analytics interno, instrumentação de eventos, monitoramento de estabilidade, logs de auditoria, dados de uso e métricas comportamentais para fins de melhoria contínua, segurança, prevenção a fraude, manutenção, suporte técnico, governança e tomada de decisão operacional.",
      ],
    },
    {
      title: "3. Finalidades do tratamento",
      body: [
        "Tratamos dados pessoais para viabilizar o funcionamento da plataforma, autenticação de usuários, cadastro, recuperação e gestão de contas, segurança dos acessos, personalização de experiência, comunicação com o usuário, emissão de documentos, execução de funcionalidades comunitárias, administração de módulos internos, disponibilização de conteúdos, notificações, comunicados, enquetes, ordens de serviço, comprovantes, carteirinhas e demais serviços da aplicação.",
        "Os dados também poderão ser utilizados para análise de uso, melhorias de produto, desenvolvimento de novas funcionalidades, suporte técnico, atendimento ao usuário, correção de falhas, auditoria, detecção e mitigação de abusos, prevenção de incidentes, conformidade regulatória, defesa judicial e exercício regular de direitos.",
        "Os usos internos dos dados coletados, inclusive dados de telemetria, comportamento, preferências, jornada do usuário, logs de uso e indicadores operacionais, integram o patrimônio informacional e analítico da operação da plataforma, podendo ser utilizados internamente de forma ampla, estratégica e contínua, desde que observados os princípios legais aplicáveis.",
      ],
    },
    {
      title: "4. Bases legais",
      body: [
        "O tratamento de dados pessoais poderá ocorrer com fundamento, conforme o caso concreto, nas seguintes bases legais: execução de contrato ou de procedimentos preliminares relacionados ao contrato; cumprimento de obrigação legal ou regulatória; exercício regular de direitos em processo judicial, administrativo ou arbitral; proteção do crédito; legítimo interesse; proteção da vida e da incolumidade física; e consentimento, quando exigido ou adotado como reforço jurídico-operacional.",
        "No contexto do cadastro e uso continuado da plataforma, o prosseguimento voluntário do usuário com o registro, ativação de conta, navegação autenticada e uso dos recursos será interpretado como manifestação inequívoca de ciência e concordância com os instrumentos jurídicos aplicáveis da plataforma, inclusive esta Política e os Termos de Uso, sem prejuízo das demais bases legais autônomas cabíveis.",
      ],
    },
    {
      title: "5. Compartilhamento de dados",
      body: [
        "A AMA da Favela não comercializa dados pessoais de usuários como ativo autônomo de mercado. Contudo, poderá compartilhar dados pessoais com parceiros vinculados à operação da aplicação, associações, organizações comunitárias, prestadores de infraestrutura, fornecedores de tecnologia, meios de autenticação, serviços de hospedagem, armazenamento, analytics, mensageria, segurança, processamento de documentos, atendimento, integração, suporte técnico, meios de pagamento e parceiros estratégicos relacionados às funcionalidades oferecidas.",
        "O compartilhamento poderá ocorrer sempre que necessário para a execução do serviço, a prestação adequada das funcionalidades, a viabilização de integrações, a operação da plataforma, a execução de fluxos internos, o atendimento de interesse legítimo da operação ou o cumprimento de exigência legal, regulatória, contratual ou judicial.",
        "Os parceiros que receberem dados deverão observar deveres de confidencialidade, segurança e tratamento compatível com a legislação aplicável e com a finalidade operacional correspondente.",
      ],
    },
    {
      title: "6. Dados de telemetria, logs e preferências",
      body: [
        "O usuário declara ciência de que a plataforma poderá coletar, registrar, consolidar, organizar, correlacionar e utilizar informações de telemetria, dados de uso, jornadas de navegação, logs de acesso, preferências de interface, padrões de interação, indicadores de performance, falhas, métricas técnicas e eventos comportamentais para fins internos da operação, monitoramento, estabilidade, segurança, inteligência de produto, melhoria de experiência, governança, auditoria e evolução da plataforma.",
        "Essas informações poderão ser utilizadas de forma agregada, segmentada ou individualizada, conforme a necessidade operacional, desde que dentro dos limites legais e da finalidade legítima da aplicação.",
      ],
    },
    {
      title: "7. Armazenamento, retenção e segurança",
      body: [
        "Os dados pessoais serão armazenados em ambientes tecnológicos próprios ou de terceiros contratados, com adoção de medidas técnicas e administrativas razoáveis e compatíveis com o estado da técnica para proteção contra acessos não autorizados, destruição, perda, alteração, comunicação ou difusão indevida.",
        "Os dados poderão ser mantidos enquanto a conta estiver ativa, durante o período necessário para execução dos serviços, pelo tempo exigido por obrigações legais, regulatórias, contratuais, de auditoria, prevenção a fraude, preservação de direitos ou conforme prazos legítimos de retenção aplicáveis à operação.",
      ],
    },
    {
      title: "8. Direitos do titular",
      body: [
        "Nos termos da LGPD e observadas as hipóteses legais, o usuário poderá solicitar confirmação da existência de tratamento, acesso aos dados, correção de dados incompletos, inexatos ou desatualizados, anonimização, bloqueio ou eliminação de dados desnecessários, portabilidade, informação sobre compartilhamentos, revogação de consentimento quando aplicável e eliminação de dados tratados com base em consentimento, ressalvadas as hipóteses legais de retenção.",
        "As solicitações poderão ser submetidas pelos canais oficiais de contato da plataforma e serão avaliadas à luz da legislação vigente, da natureza da requisição, da identidade do solicitante e das obrigações legais e operacionais incidentes.",
      ],
    },
    {
      title: "9. Cookies, armazenamento local e tecnologias similares",
      body: [
        "A plataforma poderá utilizar cookies, armazenamento local, tokens, identificadores persistentes, cache, recursos de sessão e tecnologias equivalentes para autenticação, segurança, persistência de preferências, análise de desempenho, funcionamento técnico, otimização de experiência e mensuração de uso.",
        "A desativação de determinadas tecnologias pelo usuário poderá comprometer a funcionalidade integral de certos recursos da plataforma.",
      ],
    },
    {
      title: "10. Menores de idade e responsabilidade cadastral",
      body: [
        "Quando aplicável, o usuário declara que os dados fornecidos são verdadeiros, completos e atualizados, responsabilizando-se pela licitude de seu fornecimento e pelo uso da própria conta. Caso a utilização envolva menor de idade, a operação poderá exigir representação ou assistência conforme a legislação aplicável e as regras específicas da funcionalidade correspondente.",
      ],
    },
    {
      title: "11. Transferências e infraestrutura de terceiros",
      body: [
        "Determinadas operações tecnológicas podem envolver processamento por fornecedores, serviços de nuvem, gateways, plataformas de observabilidade, analytics, mensageria, autenticação e armazenamento, inclusive em estruturas técnicas distribuídas. Nesses casos, a AMA da Favela adotará medidas contratuais e operacionais razoáveis para preservar a conformidade e a segurança do tratamento.",
      ],
    },
    {
      title: "12. Alterações desta Política",
      body: [
        "Esta Política poderá ser alterada, atualizada, substituída ou consolidada a qualquer tempo, a exclusivo critério da plataforma, para refletir mudanças legais, regulatórias, técnicas, operacionais ou estratégicas. A versão vigente será sempre a publicada nos canais oficiais da aplicação.",
      ],
    },
    {
      title: "13. Contato",
      body: [
        "Dúvidas, solicitações ou comunicações relacionadas a esta Política poderão ser encaminhadas ao canal oficial de atendimento informado pela plataforma em seus ambientes públicos ou internos.",
      ],
    },
  ],
};

export const TERMS_OF_USE_CONTENT: LegalDocumentContent = {
  title: "Termos e Condições de Uso",
  shortTitle: "Termos de Uso",
  version: LEGAL_TERMS_VERSION,
  updatedAtLabel: "Última atualização: 01 de abril de 2026",
  intro: [
    "Estes Termos e Condições de Uso regulam o acesso e a utilização da plataforma AMA da Favela, incluindo website, aplicativo móvel, áreas autenticadas, módulos administrativos, documentos digitais, integrações, conteúdos e funcionalidades associadas.",
    "Ao acessar, cadastrar-se, navegar, utilizar recursos, enviar informações ou manter conta ativa na plataforma, o usuário declara que leu, compreendeu e concorda integralmente com estes Termos, com a Política de Privacidade e com as demais regras aplicáveis à operação.",
  ],
  sections: [
    {
      title: "1. Objeto",
      body: [
        "A plataforma AMA da Favela disponibiliza ambiente digital para oferta, gestão, organização e acesso a serviços, rotinas comunitárias, comunicação institucional, módulos administrativos, enquetes, publicações, ordens de serviço, documentos, carteirinhas, comprovantes, informações de associação, anúncios, projetos sociais e demais funcionalidades integradas ao ecossistema da aplicação.",
      ],
    },
    {
      title: "2. Elegibilidade e cadastro",
      body: [
        "Para utilizar determinadas funcionalidades, o usuário deverá realizar cadastro e fornecer informações verdadeiras, completas, atualizadas e verificáveis. O usuário é integralmente responsável pela exatidão dos dados fornecidos, pela guarda de suas credenciais e por toda atividade realizada em sua conta.",
        "A plataforma poderá adotar mecanismos de validação, revisão, bloqueio, suspensão ou recusa cadastral sempre que identificar inconsistências, suspeitas de fraude, violação de regras internas, uso indevido, risco operacional ou necessidade de proteção da comunidade e da própria operação.",
      ],
    },
    {
      title: "3. Aceitação automática dos instrumentos jurídicos",
      body: [
        "O cadastro, a ativação de conta, o login, a permanência autenticada, a navegação em áreas protegidas e o uso continuado da plataforma constituem manifestação válida e suficiente de concordância com estes Termos e com a Política de Privacidade.",
        "Por essa razão, o aceite não depende de checkbox destacada ou assinatura manual individualizada, desde que os documentos estejam acessíveis de forma clara, pública e permanente antes e durante o processo de uso da plataforma.",
      ],
    },
    {
      title: "4. Regras de uso",
      body: [
        "O usuário compromete-se a utilizar a plataforma de forma lícita, ética e compatível com sua finalidade, abstendo-se de praticar atos que violem a legislação, a boa-fé, direitos de terceiros, a segurança da aplicação, a integridade de dados, as políticas internas ou o regular funcionamento dos serviços.",
        "É vedado, entre outras condutas: utilizar dados falsos; tentar acessar áreas não autorizadas; praticar fraude; enviar conteúdo ilícito, ofensivo ou enganoso; violar propriedade intelectual; explorar vulnerabilidades; interferir em rotinas técnicas; manipular métricas; burlar permissões; utilizar automações abusivas; ou empregar a plataforma para finalidade estranha à sua destinação.",
      ],
    },
    {
      title: "5. Conteúdo, documentos e funcionalidades",
      body: [
        "A plataforma poderá disponibilizar recursos de cadastro, emissão, visualização, download, validação, publicação, comunicação, solicitação e gerenciamento de conteúdos, documentos e registros digitais. O usuário reconhece que tais recursos dependem de dados fornecidos, integrações, regras internas, permissões, contexto operacional e disponibilidade técnica.",
        "A eventual disponibilização de documentos, comprovantes, carteirinhas ou registros institucionais por meio da plataforma não exime o usuário da responsabilidade sobre a veracidade das informações fornecidas nem limita a possibilidade de conferência, revisão, suspensão, revogação, expiração ou cancelamento do documento quando juridicamente ou operacionalmente cabível.",
      ],
    },
    {
      title: "6. Dados, telemetria e uso interno",
      body: [
        "O usuário reconhece que a operação da plataforma poderá envolver coleta e tratamento de dados cadastrais, dados de uso, telemetria, logs, preferências, eventos de navegação, métricas operacionais e demais informações descritas na Política de Privacidade.",
        "Tais dados poderão ser utilizados internamente de forma ampla pela operação da AMA da Favela para fins de segurança, gestão, monitoramento, analytics, prevenção a fraude, inteligência operacional, melhoria de produto, evolução de funcionalidades, governança e estratégia, observada a legislação aplicável.",
      ],
    },
    {
      title: "7. Compartilhamento com parceiros",
      body: [
        "O usuário declara ciência de que dados e informações relacionados ao uso da plataforma poderão ser compartilhados com parceiros vinculados à operação, associações, prestadores de serviço, fornecedores de tecnologia, operadores, integrações e organizações relacionadas às funcionalidades disponibilizadas, sempre para finalidades legítimas, operacionais, contratuais, regulatórias ou tecnológicas.",
        "A plataforma não comercializa dados pessoais como mercadoria autônoma, mas poderá compartilhá-los dentro de seu ecossistema operacional e de parceiros vinculados, nos limites da legislação e da finalidade do serviço.",
      ],
    },
    {
      title: "8. Propriedade intelectual",
      body: [
        "Salvo disposição em contrário, todos os direitos relacionados à plataforma, incluindo software, layout, identidade visual, arquitetura, fluxos, bases compiladas, textos institucionais, elementos gráficos, marcas, sinais distintivos, documentação e demais ativos intelectuais, pertencem à AMA da Favela ou a terceiros licenciantes, sendo vedada sua reprodução, engenharia reversa, adaptação, exploração ou uso não autorizado.",
      ],
    },
    {
      title: "9. Disponibilidade e alterações da plataforma",
      body: [
        "A plataforma poderá ser modificada, atualizada, interrompida, suspensa, expandida, reduzida, reestruturada ou descontinuada, total ou parcialmente, a qualquer tempo, por razões técnicas, operacionais, comerciais, estratégicas, regulatórias, de segurança ou manutenção, sem que isso gere direito adquirido à manutenção integral e permanente de qualquer funcionalidade específica.",
      ],
    },
    {
      title: "10. Suspensão, bloqueio e exclusão",
      body: [
        "A AMA da Favela poderá suspender, restringir, bloquear ou excluir contas, conteúdos, acessos, permissões ou funcionalidades sempre que identificar violação destes Termos, risco à segurança, indício de fraude, uso abusivo, irregularidade cadastral, determinação legal, necessidade de contenção de danos ou proteção da comunidade e da operação.",
        "O usuário também poderá solicitar exclusão de conta pelos canais disponibilizados, observadas as hipóteses legais de retenção de dados e preservação de registros necessários ao cumprimento de obrigações legais, defesa de direitos e prevenção a fraudes.",
      ],
    },
    {
      title: "11. Limitação de responsabilidade",
      body: [
        "Na máxima extensão permitida pela legislação aplicável, a plataforma não se responsabiliza por indisponibilidades decorrentes de fatores externos, falhas de terceiros, problemas de conectividade, eventos de força maior, condutas de usuários, informações inseridas por terceiros, integrações externas, uso indevido de credenciais, danos decorrentes de mau uso da aplicação ou decisões tomadas exclusivamente com base em conteúdos disponibilizados por usuários ou parceiros.",
      ],
    },
    {
      title: "12. Conformidade legal",
      body: [
        "O usuário compromete-se a cumprir a legislação brasileira aplicável, inclusive normas civis, consumeristas, digitais, penais, administrativas e de proteção de dados, bem como políticas específicas eventualmente publicadas para módulos, serviços ou funcionalidades determinadas.",
      ],
    },
    {
      title: "13. Alterações destes Termos",
      body: [
        "Estes Termos poderão ser alterados a qualquer momento para refletir atualização legal, regulatória, técnica, operacional ou estratégica. A versão vigente será aquela publicada nos canais oficiais da plataforma, passando a produzir efeitos a partir de sua disponibilização pública, salvo quando outra regra temporal for expressamente indicada.",
      ],
    },
    {
      title: "14. Foro e legislação aplicável",
      body: [
        "Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro competente nos termos da legislação aplicável, ressalvadas as hipóteses de competência absoluta e os direitos assegurados ao consumidor quando incidentes.",
      ],
    },
  ],
};
