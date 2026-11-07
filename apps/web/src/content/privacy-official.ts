// Official IOMA Paris privacy policy, reproduced word for word from https://ioma-paris.com/policies/privacy-policy
// (retrieved 2026-11-07). It is written in French for the French controller (ADS FORMATION ET PRODUITS - IEVA GROUP).
// Links inside the text are written {{url|label}}. Do not edit the wording here: counsel owns it. UAE-specific
// additions, if any, must be approved separately.
export type PolicyBlock = { t: "p"; x: string } | { t: "ul"; x: string[] };
export type PolicySection = {
  id: string;
  level: 1 | 2;
  heading: string;
  blocks: PolicyBlock[];
};

export const PRIVACY_OFFICIAL: PolicySection[] = [
  {
    id: "preambule",
    level: 1,
    heading: "Préambule",
    blocks: [
      {
        t: "p",
        x: "#YOURDATAISYOURS",
      },
      {
        t: "p",
        x: "Nous savons que vous vous souciez de vos données personnelles et de la manière dont elles sont utilisées. Faites confiance à ADS FORMATION ET PRODUITS - IEVA GROUP qui s’engage à les utiliser avec le plus grand soin. Cette Politique de confidentialité vous explique le type de données personnelles que nous collectons, pourquoi nous le faisons et comment nous les utilisons. En lisant cette Politique de confidentialité, n’oubliez pas qu’elle s’applique à ADS FORMATION ET PRODUITS - IEVA GROUP définie {{#who|ci-après}}. Prenez le temps de vous familiariser avec nos pratiques sur le respect de la vie privée et veuillez nous faire part de vos questions en nous envoyant un email {{mailto:serviceclients@ioma-paris.com|serviceclients@ioma-paris.com}}. Nous avons essayé de simplifier cette Politique au maximum, mais si vous ne comprenez pas bien les termes Cookies, Adresses IP et Navigateurs, informez-vous d’abord sur ces termes-clés {{https://ioma-paris.com/pages/termes-cles|ici}}. Vous bénéficiez du droit d’opposition à certaines utilisations de vos données personnelles, dont l’utilisation de vos données personnelles à des fins de marketing direct. Vous pouvez voir quels sont vos droits et comment vous pouvez les exercer {{#rights|ici}}.",
      },
    ],
  },
  {
    id: "s-1",
    level: 1,
    heading: "1. Qui se charge de la collecte ?",
    blocks: [
      {
        t: "p",
        x: "Toutes les données personnelles fournies à ou collectées par ADS FORMATION ET PRODUITS - IEVA GROUP sont contrôlées par ADS FORMATION ET PRODUITS - IEVA GROUP, 87 Rue Réaumur, 75002 PARIS - FRANCE (les responsables du traitement des données). Cette Politique de confidentialité s'applique aux données personnelles collectées par ADS FORMATION ET PRODUITS - IEVA GROUP en rapport avec les services et les produits que nous offrons. Lorsqu’on fait référence à « ADS FORMATION ET PRODUITS - IEVA GROUP » dans cette Politique de confidentialité, on signifie ADS FORMATION ET PRODUITS - IEVA GROUP. Cette Politique de confidentialité s’applique aussi aux contenus marketing d’ADS FORMATION ET PRODUITS - IEVA GROUP, incluant les offres et les publicités pour les produits et services ADS FORMATION ET PRODUITS - IEVA GROUP, que nous (ou un fournisseur de services agissant en notre nom) pouvons vous envoyer sur des sites Internet, des plateformes et des applications d’un tiers en fonction de vos informations d’utilisation du site. En général, ces sites tiers ont leur propre Politique de confidentialité et leurs propres Conditions générales. Nous vous encourageons à les consulter avant d’utiliser ces sites Internet.",
      },
    ],
  },
  {
    id: "s-2",
    level: 1,
    heading: "2. Quelles données personnelles collectons-nous ?",
    blocks: [
      {
        t: "p",
        x: "On entend par données personnelles toute information pouvant être utilisée pour identifier directement ou indirectement une personne particulière. Cette définition inclut les données personnelles recueillies hors connexion grâce à nos Centres d’Engagement Consommateur, aux campagnes de marketing direct, aux loteries et aux concours, et en ligne grâce à nos sites Internet, applications et pages consacrées à nos marques sur des plateformes tierces et aux applications accessibles ou utilisées sur des plateformes tierces. Nous pouvons recueillir des informations personnelles auprès de différentes sources, y compris :",
      },
      {
        t: "ul",
        x: [
          "Les informations personnelles que vous nous donnez directement,",
          "Les informations personnelles que nous recueillons automatiquement, et",
          "Les informations personnelles que nous recueillons à partir d’autres sources.",
        ],
      },
      {
        t: "p",
        x: "On peut vous demander de fournir vos données personnelles quand vous nous contactez. Les responsables du traitement des données peuvent partager ces données personnelles entre eux et les utiliser conformément à cette Politique de confidentialité. Nous pouvons aussi les combiner avec d’autres informations pour améliorer nos produits, services, contenus et publicités. Vous n'êtes pas obligés de fournir à ADS FORMATION ET PRODUITS - IEVA GROUP les données personnelles que nous demandons, mais si vous choisissez de ne pas le faire, nous ne serons peut-être pas en mesure de vous fournir nos produits et services, ou une très grande qualité de service, ou de répondre à n’importe quelle demande.",
      },
    ],
  },
  {
    id: "s-2-1",
    level: 2,
    heading: "2.1. Nos méthodes de collecte de vos données personnelles",
    blocks: [
      {
        t: "p",
        x: "Nous pouvons recueillir des informations personnelles auprès de différentes sources, y compris :",
      },
      {
        t: "ul",
        x: [
          "Les informations personnelles que vous nous donnez directement. Nous collectons des données sur votre manière d’utiliser nos services et produits, par exemple les types de contenu que vous regardez ou qui vous intéressent, ou la fréquence et la durée de vos activités. Nous recueillons aussi des données personnelles que vous nous fournissez dès lors que vous vous inscrivez à une newsletter marketing, que vous effectuez une enquête ou que vous ouvrez un compte pour acheter nos produits. Ce faisant, nous pouvons vous demander des informations personnelles telles que votre nom, votre sexe, votre date de naissance, votre adresse, votre adresse e-mail, votre numéro de téléphone ou vos coordonnées bancaires. Certaines marques ADS FORMATION ET PRODUITS - IEVA GROUP peuvent collecter des “ catégories spéciales de données personnelles” à votre sujet avec votre consentement explicite. Pour en savoir plus sur les catégories spéciales de données que nous collectons et comment nous les utilisons, consultez la partie concernée ci-dessous.",
          "Les informations personnelles que nous recueillons automatiquement. Nous recevons et mémorisons également certains types d’informations personnelles à chaque fois que vous interagissez avec nous en ligne. Par exemple, nous utilisons des cookies et des technologies de traçage (pour en savoir plus, référez-vous à nos termes-clés {{https://ioma-paris.com/pages/termes-cles|ici}}) pour obtenir des informations personnelles lorsque votre navigateur web accède à nos sites Internet ou aux publicités et autres contenus fournis par ou au nom d’ADS FORMATION ET PRODUITS - IEVA GROUP sur d’autres sites Internet. Vos informations personnelles sont aussi recueillies lorsque vous recherchez, achetez, postez, participez à un concours ou un questionnaire ou communiquez avec nos équipes du service clientèle. Les types d’informations personnelles collectées peuvent comprendre par exemple une adresse IP (pour en savoir plus, référez-vous à nos termes-clés {{https://ioma-paris.com/pages/termes-cles|ici}}), un ID de l’appareil, des données de localisation, des informations sur l'ordinateur et la connexion telles que le type et la version du navigateur, le réglage du fuseau horaire, des types et versions de plug-in du navigateur, le système d’exploitation et l’historique des achats – qu'ADS FORMATION ET PRODUITS - IEVA GROUP regroupe parfois avec des informations similaires provenant d’autres consommateurs. Lorsque vous naviguez sur des sites Internet d’ADS FORMATION ET PRODUITS - IEVA GROUP, nous pouvons aussi utiliser des outils logiciels afin de mesurer et de collecter des informations sur la session, notamment les temps de réponse des pages, les erreurs de téléchargement, la durée des visites sur certaines pages, l’interaction avec la page et les méthodes utilisées pour naviguer hors de la page. Nous pouvons également recueillir des informations techniques nous permettant d’identifier votre appareil à des fins de diagnostic et de prévention des fraudes.",
          "Les informations personnelles que nous recueillons à partir d’autres sources. Nous collectons des informations personnelles d’autres sources incluant nos partenariats de confiance avec des tiers et là où nous avons des comptes ADS FORMATION ET PRODUITS - IEVA GROUP sur des plateformes tierces : par exemple lorsque vous utilisez la fonctionnalité “j'aime” sur Facebook . De plus, nous recevons des informations sur vous et les interactions d’autres visiteurs avec nos publicités afin de mesurer si nos publicités sont pertinentes et réussies. Nous recueillons également des informations sur vous et vos activités d’un tiers lorsque vous proposez conjointement des services ou des produits, ou de prestataires d’enrichissement des données tiers (pour en savoir plus, référez-vous à nos termes-clés {{https://ioma-paris.com/pages/termes-cles|ici}}) qui peuvent apporter des informations à ADS FORMATION ET PRODUITS - IEVA GROUP sur les données personnelles en notre possession.",
        ],
      },
    ],
  },
  {
    id: "s-2-2",
    level: 2,
    heading:
      '2.2. Quand et pourquoi collectons-nous des "catégories spéciales de données personnelles” ?',
    blocks: [
      {
        t: "p",
        x: "Certaines catégories d’informations personnelles telles que la race, l’ethnie, la religion, la santé, la sexualité ou les données biométriques sont classées comme “catégories spéciales de données” et profitent d’une protection supplémentaire selon la législation européenne sur la protection des données. Nous limitons les cas où nous collectons et traitons ces catégories spéciales de données. ADS FORMATION ET PRODUITS - IEVA GROUP recueille parfois des données concernant votre santé, par ex. allergies, grossesse ou type de peau, afin de vous envoyer des publicités personnalisées et des promotions pertinentes. ADS FORMATION ET PRODUITS - IEVA GROUP ne collecte et n’utilise ces informations personnelles que lorsque vous nous avez donné votre consentement de le faire. Dans certains cas, on peut vous demander des services ou des produits qui n’exigent pas directement la collecte de catégories spéciales de données mais peuvent impliquer ou insinuer votre religion, votre santé ou d’autres catégories spéciales de données. Pour illustrer les cas où ADS FORMATION ET PRODUITS - IEVA GROUP recueille et traite des catégories spéciales de données, nous avons donné les exemples suivants :",
      },
      {
        t: "ul",
        x: [
          "ADS FORMATION ET PRODUITS - IEVA GROUP collecte les habitudes d’exposition au soleil ou le type de peau dans le compte personnel afin de proposer aux clients des publicités et des promotions pour des produits correspondant à leurs besoins.",
          "ADS FORMATION ET PRODUITS - IEVA GROUP collecte parfois des informations au sujet de votre peau (tranche d’âge, exposition au soleil, type de peau, hydratation, rides, ridules) pour ses appareils de diagnostic afin de vous conseiller sur le type de produit qui serait le plus adapté à vos besoins.",
        ],
      },
    ],
  },
  {
    id: "s-2-3",
    level: 2,
    heading: "2.3. Comment protégeons-nous la vie privée des enfants ?",
    blocks: [
      {
        t: "p",
        x: "Nous comprenons l’importance de prendre des précautions supplémentaires pour protéger la vie privée et la sécurité des enfants utilisant des produits et services ADS FORMATION ET PRODUITS - IEVA GROUP. Les sites d’ADS FORMATION ET PRODUITS - IEVA GROUP, incluant celui d’IOMA, sont conçus pour les adultes et destinés à être utilisés par ces derniers. Nous utilisons parfois vos informations personnelles pour effectuer des vérifications concernant l’âge et faire appliquer toute limite d’âge.",
      },
    ],
  },
  {
    id: "s-3",
    level: 1,
    heading: "3. Quel usage faisons-nous de vos données ?",
    blocks: [
      {
        t: "p",
        x: "Nous collectons, traitons et divulguons vos informations personnelles uniquement à des fins spécifiques et limitées. Par exemple, pour effectuer vos paiements, accéder aux réclamations et les traiter, développer et améliorer nos produits, nos services, nos méthodes de communication et la fonctionnalité de nos sites Internet, pour fournir des produits et communications personaliseés, des publicités ciblées, ainsi que nos recommandations de produits. Nous créons aussi des profils en analysant les informations de votre navigation en ligne, de vos recherches et de votre comportement d’achat, et les interactions avec nos communications de marque en créant des segments (créer des groupes qui ont certaines caractéristiques communes) et en plaçant vos informations personnelles dans un ou plusieurs segments. De plus, ADS FORMATION ET PRODUITS - IEVA GROUP traite vos informations personnelles à l’aide de procédés automatisés. Une décision automatisée est une décision qui est prise uniquement par des procédés automatiques où l'homme n'intervient pas adans le processus de prise de décision concernant vos informations personnelles. Nous collectons, traitons et divulguons vos informations personnelles aux fins suivantes :",
      },
      {
        t: "ul",
        x: [
          "Pour effectuer vos paiements, si vous achetez nos produits, pour vous informer de la situation de votre commande, pour traiter vos demandes d’informations et vos requêtes et pour accéder aux réclamations et les traiter;",
          "Pour traiter et répondre à vos demandes d'informations ou pour vous contacter pour répondre à vos questions et/ou requêtes;",
          "Pour développer et améliorer nos produits, nos services, nos méthodes de communication et la fonctionnalité de nos sites Internet;",
          "Dans le cadre de concours ou de promotions auxquels vous participez;",
          "Pour vous communiquer des informations et gérer votre inscription et/ou votre abonnement à notre newsletter ou à d’autres communications;",
          "Pour gérer nos besoins professionnels courants concernant votre participation à nos concours, tirages au sort, activités promotionnelles ou vos requêtes;",
          "Pour authentifier l’identité des personnes nous contactant par téléphone, par voie électronique ou autre;",
          "Dans le cadre de la formation interne et de l’assurance de la qualité;",
          "Pour comprendre et évaluer les intérêts, les volontés et les besoins de changement des consommateurs, pour améliorer notre site Internet, nos produits et services actuels et/ou développer de nouveaux produits et services ; et",
          "Pour fournir des produits personnalisés, des communications, des publicités ciblées, ainsi que nos recommandations de produits.",
        ],
      },
      {
        t: "p",
        x: "Lorsque nous collectons et utilisons vos données personnelles aux fins mentionnées ci-dessus ou pour d’autres raisons, nous vous informerons au préalable ou au moment de la collecte des données. Si nécessaire, nous demanderons votre consentement pour traiter vos informations personnelles. Si vous avez donné votre consentement pour des activités de traitement, vous avez le droit de retirer ce dernier à n’importe quel moment. Dans certains cas, nous comptons sur l’intérêt légitime à traiter vos données personnelles. Par exemple, un intérêt légitime peut s’appliquer lorsque vous adhérez à un programme de fidélisation à l’une de nos marques et que nous utilisons les données personnelles collectées pour mener des analyses de données afin d’améliorer nos produits et services. Ce motif ne sera utilisé que s’il est nécessaire d’obtenir un intérêt légitime, par exemple pour permettre l’exécution d’un contrat, ou d’optimiser un service, mais il ne l’emporte pas sur vos droits en tant qu’individu. On ne recourra à la base légale que s’il n’existe pas de moyen moins intrusif pour traiter vos données personnelles. Nous vous assurons que si nous utilisons un intérêt légitime comme motif de traitement de vos données personnelles, nous en garderons une trace et vous aurez le droit de demander ces informations.",
      },
    ],
  },
  {
    id: "s-3-1",
    level: 2,
    heading: "3.1. Profilage",
    blocks: [
      {
        t: "p",
        x: "ADS FORMATION ET PRODUITS - IEVA GROUP utilise vos données personnelles pour créer des profils. Nous créons des profils en analysant les informations de votre navigation en ligne, de vos recherches et de votre comportement d’achat, et les interactions avec nos communications de marque en créant des segments (créer des groupes qui ont certaines caractéristiques communes) et en plaçant vos informations personnelles dans un ou plusieurs segments. Ces segments sont utilisés par ADS FORMATION ET PRODUITS - IEVA GROUP pour personnaliser le site Internet et nos communications à votre intention (par ex. montrer un contenu pertinent pour vous lorsque vous visitez notre site ou dans une newsletter qui vous est destinée), et pour afficher les offres et les publicités appropriées de la part de la marque ADS FORMATION ET PRODUITS - IEVA GROUP sur le site ADS FORMATION ET PRODUITS - IEVA GROUP et via les sites de tiers. Les segments peuvent aussi être utilisés pour des campagnes de tiers sur le site ADS FORMATION ET PRODUITS - IEVA GROUP. ADS FORMATION ET PRODUITS - IEVA GROUP fait le profil de vos données lorsque vous nous avez donné votre consentement de le faire, par exemple accepter le placement de cookies sur votre navigateur en ligne ou s’inscrire à des newsletters électroniques de l’une de nos marques. Vous pouvez retirer votre consentement à tout moment pour empêcher cette utilisation de vos données personnelles en vous référant à la partie gérer les cookies de notre {{https://www.ioma-paris.com/pages/gestion-des-cookies/|Avis relatif aux cookies}} ou en vous désabonnant de l’utilisation de votre adresse e-mail si vous êtes déjà identifié(e) sur l’un de nos sites ou si vous êtes abonné(e) à des newsletters marketing. À titre d’exemple :",
      },
      {
        t: "ul",
        x: [
          "Nos pages Internet visitées et la manière dont vous interagissez avec nos contenus;",
          "Nos bannières publicitaires que nous diffusons sur les plateformes de réseaux sociaux et d’autres sites Internet d’éditeurs ; et",
          "Formulaires que vous remplissez en ligne et que vous nous envoyez concernant vos centres d’intérêt ;",
          "Formulaires que vous remplissez sur nos appareils de diagnostic ;",
        ],
      },
      {
        t: "ul",
        x: [
          "Nous suivons aussi les produits que vous achetez lorsque vous cliquez sur une de nos bannières publicitaires et achetez ensuite un produit ou un service à nos partenaires distributeurs sélectionnés.",
          "Si vous avez demandé à être informé(e) par e-mails, SMS, ou push notification de notre part, nous vous traçons dès que vous ouvrez, lisez ou cliquez sur le contenu afin de voir ce qui vous intéresse, ce qui nous permet de vous apporter plus de contenu susceptible de vous satisfaire.",
          "Nous utilisons ces données pour faire le profil de vos préférences et de vos aversions. Par exemple, si nous constatons que vous consultez régulièrement des produits spécifiques ADS FORMATION ET PRODUITS - IEVA GROUP sur notre site www.ioma-paris.com et que vous avez choisi de recevoir des e-mails, nous pourrions vous informer des nouveaux produits et routines beauté mis en ligne sur le site, ou nous pouvons adapter notre contenu web en proposant des éléments qui pourraient beaucoup vous intéresser.",
          "En fonction des informations de ces profils, nous pouvons vous proposer des publicités que, selon nous, vous aimerez et souhaiterez voir car vous regardez un contenu établi par nos soins ou notre réseau d’éditeurs avec lesquels nous faisons de la promotion. Parfois, avec votre consentement, nous pouvons utiliser votre emplacement actuel pour vous fournir des publicités qui sont liées en partie à des promotions ou des événements ayant lieu à proximité et qui, selon nous, pourraient vous intéresser.",
          "Nous pouvons aussi utiliser des informations que vous avez fournies à des tiers sélectionnés et consenties à être partagées comme votre âge, votre sexe, votre étape de la vie, votre mode de vie et des intérêts plus larges pour identifier des personnes qui auraient des intérêts similaires aux vôtres et qui pourraient être intéressées par les mêmes publicités.",
        ],
      },
    ],
  },
  {
    id: "s-3-2",
    level: 2,
    heading: "3.2. Prise de décision automatisée",
    blocks: [
      {
        t: "p",
        x: "Dans certains cas, ADS FORMATION ET PRODUITS - IEVA GROUP traite vos informations personnelles à l’aide de procédés automatisés. Une décision automatisée est une décision qui est prise uniquement par des procédés automatiques où l’homme n’intervient pas dans le processus de prise de décision concernant vos informations personnelles. Par exemple:",
      },
      {
        t: "ul",
        x: [
          "ADS FORMATION ET PRODUITS - IEVA GROUP utilise des scénarios d’e-mailing automatisés qui génèrent des campagnes e-mail basés sur vos comportements de navigation, habitudes d’achat, anniversaire.",
        ],
      },
      {
        t: "p",
        x: "Nous ne prendrons pas des décisions fondées uniquement sur une prise de décision automatisée qui aura un impact significatif sur vous. Dans le cas contraire, nous vous informerons et nous vous donnerons des informations claires sur notre décision de compter sur le traitement automatisé pour prendre notre décision et sur notre base juridique d’agir ainsi. Par exemple, ADS FORMATION ET PRODUITS - IEVA GROUP traite vos données personnelles en utilisant des moyens automatisés uniquement si c’est nécessaire pour la conclusion ou l’exécution d’un contrat avec vous ou lorsque vous avez donné votre consentement explicite. Vous avez le droit de ne pas faire l’objet d’une décision fondée exclusivement sur un traitement automatisé si la décision produit des effets juridiques vous concernant ou vous affectant de manière significative. En particulier, vous avez le droit :",
      },
      {
        t: "ul",
        x: [
          "d'obtenir une intervention humaine;",
          "d'exprimer votre point de vue;",
          "d'obtenir une explication de la décision prise après une évaluation; et",
          "de contester cette décision.",
        ],
      },
    ],
  },
  {
    id: "s-4",
    level: 1,
    heading: "4. Avec qui partageons-nous vos données personnelles ?",
    blocks: [
      {
        t: "p",
        x: "En tant qu’entreprise mondiale, ADS FORMATION ET PRODUITS - IEVA GROUP peut partager vos informations personnelles en interne, à travers les autres filiales du IEVA GROUP et avec des tierces parties sélectionnées. Par exemple, nous pouvons partager vos informations personnelles avec des prestataires de services tiers, d’autres tierces parties, ainsi qu’en cas de transferts d’entreprises ou de divulgation légale. En tant qu’entreprise mondiale, ADS FORMATION ET PRODUITS - IEVA GROUP peut partager vos informations personnelles en interne et avec des tierces parties sélectionnées dans les circonstances suivantes :",
      },
      {
        t: "ul",
        x: [
          "Prestataires de services tiers. Afin d’exécuter vos requêtes, répondre à vos demandes d’informations, traiter vos commandes, accepter des coupons, fournir des échantillons, vous permettre de participer à des loteries, mettre à votre disposition d’autres fonctionnalités, services et matériels sur nos sites, nous partageons vos données personnelles avec des prestataires de services tiers qui exercent des fonctions en notre nom. Il s’agit de sociétés qui : hébergent ou font fonctionner des sites d’ADS FORMATION ET PRODUITS - IEVA GROUP, effectuent des paiements, analysent des données, fournissent un service clientèle, des services postaux ou de livraison ainsi que des annonceurs ou d’autres parties tierces qui administrent ou participent à nos promotions. Elles ont accès aux informations personnelles nécessaires pour exercer leurs fonctions mais peuvent ne pas les utiliser à d’autres fins. De plus, elles doivent traiter ces informations personnelles conformément à cette Politique de confidentialité et dans le respect des lois et réglementations applicables sur la protection des données.",
          "Autres tierces parties. Vos données personnelles seront aussi utilisées par nous ou partagées avec des annonceurs, des agences de publicité, des réseaux publicitaires, des serveurs publicitaires, des réseaux sociaux et des entreprises d’études analytiques ou d’autres tiers en rapport avec le marketing, la promotion, l’enrichissement des données (pour en savoir plus sur nos termes-clés {{https://ioma-paris.com/pages/termes-cles|ici}}) et d’autres offres, ainsi que les informations produit.",
          "Transferts d'entreprise. Vos données personnelles seront utilisées par nous ou partagées avec les contrôleurs de données pour des raisons internes, essentiellement à des fins professionnelles et opérationnelles. Dans le cadre du développement de notre entreprise, nous pouvons vendre ou acheter des actifs, des filiales ou des unités opérationnelles. Dans ces transactions, vos données personnelles sont généralement un des actifs de l’entreprise transférés mais restent soumises aux promesses faites dans toute Politique de confidentialité préexistante (sauf consentement contraire). Si une autre entité fait notre acquisition, celle de nos entreprises ou tout ou partie de nos actifs, ou actifs liés aux sites d’ADS FORMATION ET PRODUITS - IEVA GROUP, vos données personnelles seront divulguées à cette entité dans le cadre de la procédure de due diligence et seront transférées à cette identité en tant qu’un des actifs transférés. De plus, si une procédure de faillite ou de réorganisation est mise en œuvre par nos soins ou à notre encontre, toutes ces données personnelles seront considérées comme un de nos actifs et de ce fait, il se peut qu’elles soient vendues ou transférées à des tiers.",
          "afin de se conformer à une obligation légale;",
          "lorsque nous pensons de bonne foi que la loi l’exige ;",
          "à la demande des autorités gouvernementales menant une enquête ;",
          "afin de vérifier ou de faire appliquer nos « Conditions d’utilisation » ou d’autres politiques applicables ;",
          "afin de détecter et protéger contre la fraude, ou toute vulnérabilité technique ou de sécurité ;",
          "en vue de répondre à une urgence ; ou sinon",
          "pour protéger les droits, les biens, la sûreté ou la sécurité des tiers, des visiteurs sur les sites d’ADS FORMATION ET PRODUITS - IEVA GROUP, les appareils de diagnostic ADS FORMATION ET PRODUITS - IEVA GROUP, d’ADS FORMATION ET PRODUITS - IEVA GROUP ou du public.",
        ],
      },
    ],
  },
  {
    id: "s-4-1",
    level: 2,
    heading: "4.1. Transferts internationaux de données",
    blocks: [
      {
        t: "p",
        x: "ADS FORMATION ET PRODUITS - IEVA GROUP partage des données personnelles en interne ou avec des tiers aux fins décrites dans cette Politique de confidentialité. ADS FORMATION ET PRODUITS - IEVA GROUP transférera uniquement les données personnelles collectées dans l’Espace Économique Européen (EEE) vers des pays étrangers dans des situations comme :",
      },
      {
        t: "ul",
        x: [
          "Suivre vos instructions;",
          "Se conformer à une obligation légale; ou",
          "Travailler avec nos agents et nos annonceurs que nous utilisons pour nous aider à gérer notre entreprise et nos services.",
        ],
      },
      {
        t: "p",
        x: "Si nous devons transférer des données personnelles hors de l’EEE, ADS FORMATION ET PRODUITS - IEVA GROUP s’assurera qu’elles sont protégées de la même manière que dans l’EEE. Nous utiliserons une des garanties suivantes :",
      },
      {
        t: "ul",
        x: [
          "Transférer dans un pays hors EEE dont la législation sur la vie privée garantit un niveau de protection approprié des données personnelles comme dans un pays de l’EEE ;",
          "Mettre en place un contrat avec la tierce partie étrangère qui signifie qu’elle doit protéger les données personnelles selon les mêmes normes que l’EEE ; ou",
          "Transférer des données personnelles vers des organisations qui font partie d’accords spécifiques relatifs à des transferts de données transfrontaliers avec l’Union européenne (p. ex. le Privacy Shield ou Bouclier de protection des données est un cadre qui définit les normes de confidentialité des données transférées des pays de l’Union européenne vers les États-Unis).",
        ],
      },
    ],
  },
  {
    id: "s-5",
    level: 1,
    heading: "5. Comment protégeons-nous vos données personnelles ?",
    blocks: [
      {
        t: "p",
        x: "ADS FORMATION ET PRODUITS - IEVA GROUP prend très au sérieux la sécurité de vos données personnelles. Nous nous efforçons de protéger vos données personnelles contre tout abus, interférence, perte, accès non autorisé, modification ou divulgation. Nos mesures comprennent la mise en œuvre de contrôles d’accès appropriés, l’investissement dans les dernières Capacités de sécurité de l’information pour protéger les environnements informatiques que nous exploitons, et la garantie que nous cryptons, pseudonymisons et anonymisons des données personnelles si possible. L’accès à vos données personnelles n’est autorisé que parmi nos employés et nos agents sur le principe du besoin de savoir et est soumis aux strictes obligations contractuelles de confidentialité lorsque les données sont traitées par des tierces parties.",
      },
    ],
  },
  {
    id: "s-6",
    level: 1,
    heading: "6. Quelle est la durée de conservation de vos données personnelles ?",
    blocks: [
      {
        t: "p",
        x: "Nous conserverons vos données personnelles le temps nécessaire à l’accomplissement de l’objectif qui était poursuivi lors de leur collecte. Par exemple, lorsque vous nous achetez un produit en ligne, nous conservons les données liées à votre achat, nous permettant ainsi d’exécuter le contrat spécifique que vous avez accepté et après quoi, nous conservons les données personnelles pendant une période nous permettant de traiter ou de répondre à des réclamations, des demandes d’informations ou des inquiétudes concernant l’achat. Vos données peuvent aussi être conservées afin que nous puissions continuer d’améliorer votre expérience à nos côtés et de vous garantir de recevoir des récompenses de fidélisation auxquelles vous avez droit. Nous conservons les données identifiables, que nous collectons directement à des fins de ciblage, pendant une période limitée au minimum, après quoi nous prenons des mesures afin de les supprimer définitivement. Nous examinerons activement les données personnelles en notre possession et les supprimerons en toute sécurité, ou les anonymiserons dans certains cas, lorsqu’il n’est plus nécessaire de les conserver à des fins juridiques, professionnelles ou de consommation.",
      },
    ],
  },
  {
    id: "s-7",
    level: 1,
    heading: "7. Quels sont vos droits ?",
    blocks: [
      {
        t: "p",
        x: "Vos droits concernent la manière de traiter vos données personnelles. Vous pouvez exercer ces droits à tout moment. Nous vous proposons ci-dessous un aperçu de ces droits et ce que cela implique pour vous. Vous pouvez exercer vos droits en envoyant un e-mail {{mailto:serviceclients@ioma-paris.com|serviceclients@ioma-paris.com}}.",
      },
      {
        t: "ul",
        x: [
          "Le droit à l'information. Vous avez le droit d’obtenir des informations claires, transparentes et facilement compréhensibles sur la façon d’utiliser vos données personnelles et vos droits. Par conséquent, nous vous fournissons les informations dans cette Politique de confidentialité.",
          "Le droit d'accès et de rectification. Vous avez le droit d’accéder, de corriger ou d’actualiser vos données personnelles à tout moment. Nous en comprenons l’importance et si vous souhaitez exercer vos droits, veuillez nous contacter.",
          "Le droit à la portabilité des données. Le droit à la portabilité est limité aux données personnelles que vous nous avez fournies. Cela signifie qu’elles peuvent être données, copiées ou transmises par voie électronique dans certaines circonstances.",
          "Le droit à l'oubli. Vous avez le droit de demander la suppression de vos données dans certaines circonstances. Si vous souhaitez supprimer vos données personnelles en notre possession, veuillez nous le faire savoir et nous prendrons des mesures raisonnables pour répondre à votre requête conformément aux prescriptions légales. Si les données personnelles collectées ne sont plus nécessaires et que la loi ne nous oblige pas à les conserver, nous ferons en sorte de les supprimer, de les détruire ou de les anonymiser définitivement.",
          "Le droit de limiter le traitement des données. Vous avez le droit de limiter le traitement de vos données personnelles dans certaines circonstances.",
          "Le droit d'opposition. Vous avez le droit de vous opposer à certains types de traitement des données dans certains cas, notamment le traitement des données à des fins de marketing direct (c.-à-d. recevoir des e-mails de notre part vous le notifiant ou être contacté en proposant différentes possibilités).",
          "Le droit de porter plainte auprès d’une Autorité de contrôle.. Vous avez le droit de porter plainte directement auprès d’une Autorité de contrôle locale sur la manière dont nous traitons vos données personnelles.",
          "Le droit de retirer le consentement. Si vous avez donné votre consentement pour que nous traitions vos données personnelles à des fins quelconques (nous nous appuyons sur le consentement comme base légale de traitement de vos données personnelles), vous avez le droit de retirer votre consentement à tout moment (mais dans ce cas, cela ne signifie pas que notre utilisation de vos données personnelles avec votre consentement à ce stade est illégale). Vous pouvez retirer votre consentement au traitement de vos données personnelles à tout moment en nous contactant en précisant les détails ci-dessous.",
          "Le droit à s’inscrire sur la liste d’opposition au démarchage téléphonique du dispositif Bloctel : {{https://www.bloctel.gouv.fr|https://www.bloctel.gouv.fr}}.",
          "d'obtenir une intervention humaine;",
          "d'exprimer votre point de vue;",
          "d'obtenir une explication de la décision prise après une évaluation ; et",
          "de contester cette décision",
        ],
      },
      {
        t: "p",
        x: "Vous pouvez obtenir des informations et des conseils supplémentaires sur vos droits auprès de l’organisme régulateur de la protection des données de votre pays.",
      },
    ],
  },
  {
    id: "s-8",
    level: 1,
    heading: "8. Comment contacter ADS FORMATION ET PRODUITS - IEVA GROUP ?",
    blocks: [
      {
        t: "p",
        x: "Si vous avez des questions ou des préoccupations sur la Politique de confidentialité ou le traitement des données d’ADS FORMATION ET PRODUITS - IEVA GROUP ou si vous souhaitez porter réclamation sur une éventuelle violation des lois locales sur la vie privée, contactez-nous en envoyant un e-mail {{mailto:serviceclients@ioma-paris.com|serviceclients@ioma-paris.com}}. Lorsque nous recevons une question sur la vie privée ou une demande d’accès, nous mettons à disposition une équipe dédiée qui trie les contacts et cherche à traiter les préoccupations ou demandes d’informations spécifiques dont vous nous faites part. Lorsque votre problème est plus important, vous pouvez rechercher plus d’informations. Tous ces contacts sérieux reçoivent une réponse. Si vous n’êtes pas satisfait de la réponse reçue, vous pouvez en référer à votre Autorité de contrôle concernée dans votre pays. Si vous nous le demandez, nous ferons en sorte de vous fournir des informations sur les voies de recours pertinentes qui peuvent s’appliquer à votre cas.",
      },
    ],
  },
  {
    id: "s-9",
    level: 1,
    heading: "9. Comment actualisons nous cette politique de confidentialité ?",
    blocks: [
      {
        t: "p",
        x: "La mise à jour de cette Politique de confidentialité intègre le cas échéant les commentaires des clients et les modifications apportées à nos produits et services. Lorsque nous apportons des changements à cet énoncé, nous corrigeons la date de « dernière mise à jour » indiquée en haut de ce document. Si les changements sont considérables, nous proposerons une Politique de confidentialité plus importante (incluant pour certains services, une notification par e-mail des changements apportés à la Politique de confidentialité). Nous archiverons aussi les versions précédentes de cette Politique de confidentialité pour que vous puissiez les consulter. Selon cette Politique de confidentialité, nous ne diminuerons pas vos droits sans votre consentement.",
      },
    ],
  },
  {
    id: "s-10",
    level: 1,
    heading: "10. Conditions ou politiques supplémentaires en matière de confidentialité",
    blocks: [
      {
        t: "p",
        x: "En plus de cette Politique de confidentialité, nous pouvons mener des campagnes ou promotions particulières qui seront régies par des conditions ou politiques supplémentaires en matière de confidentialité. Nous vous encourageons à consulter ces conditions ou politiques supplémentaires avant de participer à ces campagnes ou promotions, car vous devrez vous y conformer si vous participez Toutes les conditions ou politiques supplémentaires en matière de confidentialité vous seront particulièrement mises en évidence.",
      },
    ],
  },
  {
    id: "s-11",
    level: 1,
    heading: "11. Consentement à l'utilisation de cookies.",
    blocks: [
      {
        t: "p",
        x: "Pour le bon fonctionnement de notre site Web, nous utilisons des cookies. Afin d'obtenir votre consentement valide pour l'utilisation et le stockage de cookies dans le navigateur que vous utilisez pour accéder à notre site Web et pour documenter correctement ceci, nous utilisons une plateforme de gestion des consentements : SirData . Cette technologie est fournie par SirData, 20 Rue Saint-Fiacre, 75002 Paris, France. Site web : {{https://www.sirdata.com/|https://www.sirdata.com/}}.",
      },
      {
        t: "p",
        x: "Toutes les informations relatives à la collecte et gestion des cookies est disponible dans la page {{https://www.ioma-paris.com/pages/gestion-des-cookies|Politique de cookie}}.",
      },
      {
        t: "p",
        x: "Dernière mise à jour 01 mars 2026.",
      },
    ],
  },
];

export const PRIVACY_SOURCE = {
  url: "https://ioma-paris.com/policies/privacy-policy",
  retrieved: "2026-11-07",
} as const;

/** A translation mirrors the French sections by id: a string is a paragraph, an array is a bullet list. */
export type PolicyTranslation = Record<
  string,
  { heading: string; blocks: (string | string[])[] }
>;
