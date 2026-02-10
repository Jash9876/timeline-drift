const GameData = {
    initialState: {
        year: 2030,
        metrics: {
            stability: 60,
            economy: 60,
            environment: 60,
            trust: 60
        },
        hiddenWeights: {
            climateRisk: 0,
            techDependency: 0,
            socialUnrest: 0
        }
    },

    decisionPool: [
        // --- INFRASTRUCTURE & TECH ---
        {
            id: 'infra_01',
            title: '🌉 Critical Bridge Failure',
            theme: 'infra',
            description: 'Major transit arteries are crumbling. Immediate action is required to prevent collapse.',
            choiceA: {
                label: 'Privatize & Toll',
                text: 'Sell rights to corporations. Efficiency up, public access down.',
                impact: { economy: 15, trust: -15, stability: -5, environment: 0 },
                weightMod: { socialUnrest: 15 }
            },
            choiceB: {
                label: 'Tax-Funded Repair',
                text: 'Raise taxes to fix it publicly. Slow but fair.',
                impact: { economy: -12, trust: 12, stability: 8, environment: 0 },
                weightMod: { socialUnrest: -5 }
            }
        },
        {
            id: 'ai_01',
            title: 'Predictive Justice',
            theme: 'ai',
            description: 'AI can predict crimes with 89% accuracy before they happen. Do we authorize pre-emptive arrests?',
            choiceA: {
                label: 'Authorize System',
                text: 'Safety is paramount. Arrest the potential criminals.',
                impact: { economy: 5, trust: -15, stability: 5, environment: 0 },
                weightMod: { techDependency: 25, socialUnrest: 15 }
            },
            choiceB: {
                label: 'Reject Algorithm',
                text: 'Preserve civil liberties. Risk higher crime rates.',
                impact: { economy: -5, trust: 10, stability: -10, environment: 0 },
                weightMod: { techDependency: -5 }
            }
        },

        // --- ENVIRONMENT & ENERGY ---
        {
            id: 'energy_01',
            title: '⚡ Grid Overload',
            theme: 'energy',
            description: 'Extreme heatwaves are melting the power grid. We need emergency power now.',
            choiceA: {
                label: 'Emergency Coal',
                text: 'Burn reserves. Cheap, dirty, effective.',
                impact: { economy: 5, trust: 0, stability: 5, environment: -15 },
                weightMod: { climateRisk: 20 }
            },
            choiceB: {
                label: 'Rolling Blackouts',
                text: 'Cut power to industries. Save the atmosphere.',
                impact: { economy: -10, trust: -5, stability: -10, environment: 5 },
                weightMod: { climateRisk: -5, socialUnrest: 15 }
            }
        },
        {
            id: 'ocean_01',
            title: 'Arctic Mining',
            theme: 'ocean',
            description: 'Melting ice reveals massive rare-earth deposits needed for batteries.',
            choiceA: {
                label: 'Drill Baby Drill',
                text: 'Extract resources to fuel the tech boom.',
                impact: { economy: 15, trust: 0, stability: 5, environment: -15 },
                weightMod: { climateRisk: 25 }
            },
            choiceB: {
                label: 'Declare Sanctuary',
                text: 'Protect the fragile ecosystem forever.',
                impact: { economy: -10, trust: 5, stability: 0, environment: 15 },
                weightMod: { climateRisk: -5 }
            }
        },

        // --- SOCIETY & BIO ---
        {
            id: 'bio_01',
            title: 'Designer Babies',
            theme: 'bio',
            description: 'Gene editing can now eliminate all birth defects, for a price.',
            choiceA: {
                label: 'Legalize Market',
                text: 'Allow wealthy families to enhance their children.',
                impact: { economy: 15, trust: -10, stability: -10, environment: 0 },
                weightMod: { socialUnrest: 20 }
            },
            choiceB: {
                label: 'Ban Procedure',
                text: 'Keep the human genome pure and equal.',
                impact: { economy: -5, trust: 5, stability: 5, environment: 0 },
                weightMod: { socialUnrest: -5 }
            }
        },
        {
            id: 'bio_02',
            title: '🦠 Pandemic Protocol',
            theme: 'bio',
            description: 'A new viral strain is detected. A complete lockdown would stop it but crush the economy.',
            choiceA: {
                label: 'Total Lockdown',
                text: 'Freeze everything. Save lives.',
                impact: { economy: -15, trust: 10, stability: -5, environment: 10 },
                weightMod: { socialUnrest: 15 }
            },
            choiceB: {
                label: 'Herd Immunity',
                text: 'Keep businesses open. Let it wash through.',
                impact: { economy: 5, trust: -15, stability: -10, environment: 0 },
                weightMod: { socialUnrest: 25 }
            }
        },

        // --- NEW SCENARIOS ---
        {
            id: 'space_01',
            title: 'Mars Colony',
            theme: 'infra',
            description: 'A private corporation wants to launch a colony ship. They demand tax exemption.',
            choiceA: {
                label: 'Grant Exemption',
                text: 'Humanity must become multi-planetary.',
                impact: { economy: -5, trust: -5, stability: -5, environment: 0 },
                weightMod: { techDependency: 15 }
            },
            choiceB: {
                label: 'Tax Them',
                text: 'They must pay their fair share to Earth.',
                impact: { economy: 5, trust: 10, stability: -10, environment: 0 },
                weightMod: { socialUnrest: -5 }
            }
        },
        {
            id: 'ai_02',
            title: 'Automated Workforce',
            theme: 'ai',
            description: 'Robots can replace 40% of manual labor. Unemployment will skyrocket without UBI.',
            choiceA: {
                label: 'Full Automation',
                text: 'Efficiency is the goal. Adapt or perish.',
                impact: { economy: 15, trust: -15, stability: -10, environment: 5 },
                weightMod: { socialUnrest: 25, techDependency: 25 }
            },
            choiceB: {
                label: 'Job Protection',
                text: 'Legislate "Human-Only" roles.',
                impact: { economy: -5, trust: 15, stability: 10, environment: 0 },
                weightMod: { techDependency: -10 }
            }
        },
        {
            id: 'ocean_02',
            title: 'Desalination Project',
            theme: 'ocean',
            description: 'Fresh water is scarce. A massive desalination plant can help, but it harms marine life.',
            choiceA: {
                label: 'Build Plant',
                text: 'Water is life. Build it.',
                impact: { economy: -10, trust: 10, stability: 15, environment: -10 },
                weightMod: { climateRisk: 10 }
            },
            choiceB: {
                label: 'Ration Water',
                text: 'Strict limits on usage. Save the ocean.',
                impact: { economy: -5, trust: -10, stability: -5, environment: 5 },
                weightMod: { socialUnrest: 15 }
            }
        },
        // --- EXPANSION PACK (NEW SCENARIOS) ---
        {
            id: 'tech_neural_ads',
            title: 'Dream Ads',
            theme: 'ai',
            description: 'Advertisers want to inject commercials directly into Neural Links during sleep.',
            choiceA: {
                label: 'Allow Ads',
                text: 'Subsidize dreams for the poor.',
                impact: { economy: 15, trust: -15, stability: -5, environment: 0 },
                weightMod: { techDependency: 20 }
            },
            choiceB: {
                label: 'Ban Intrusion',
                text: 'The subconscious is sacred.',
                impact: { economy: -5, trust: 10, stability: 5, environment: 0 },
                weightMod: { techDependency: -5 }
            }
        },
        {
            id: 'bio_lab_meat',
            title: 'Synthetic Steak',
            theme: 'bio',
            description: 'Lab-grown meat is cheaper and cleaner, but traditional farmers are rioting.',
            choiceA: {
                label: 'Scale Production',
                text: 'End animal suffering and hunger.',
                impact: { economy: 10, trust: 0, stability: -10, environment: 15 },
                weightMod: { climateRisk: -15 }
            },
            choiceB: {
                label: 'Protect Farmers',
                text: 'Subsidize real meat. Preserve culture.',
                impact: { economy: -10, trust: 5, stability: 10, environment: -15 },
                weightMod: { socialUnrest: -5 }
            }
        },
        {
            id: 'space_asteroid',
            title: 'Asteroid Capture',
            theme: 'infra',
            description: 'A platinum-rich asteroid is passing by. We can capture it, but a mistake could be fatal.',
            choiceA: {
                label: 'Capture It',
                text: 'Infinite wealth awaits.',
                impact: { economy: 15, trust: 5, stability: -5, environment: -5 },
                weightMod: { techDependency: 25 }
            },
            choiceB: {
                label: 'Too Risky',
                text: 'Let it pass. Earth is safe.',
                impact: { economy: -5, trust: 0, stability: 5, environment: 0 },
                weightMod: { techDependency: -5 }
            }
        },
        {
            id: 'social_credit',
            title: 'Citizen Score',
            theme: 'ai',
            description: 'Implement a mandatory social credit score based on behavior and eco-footprint.',
            choiceA: {
                label: 'Implement',
                text: 'Force good behavior. Optimize society.',
                impact: { economy: 10, trust: -15, stability: 10, environment: 10 },
                weightMod: { socialUnrest: 20, techDependency: 15 }
            },
            choiceB: {
                label: 'Reject',
                text: 'Freedom over optimization.',
                impact: { economy: -5, trust: 10, stability: -5, environment: -5 },
                weightMod: { socialUnrest: -5 }
            }
        },
        {
            id: 'ocean_plastic',
            title: 'The Great Patch',
            theme: 'ocean',
            description: 'The Pacific Garbage Patch is now the size of a continent. A bacteria can eat it, but might mutate.',
            choiceA: {
                label: 'Release Bacteria',
                text: 'Clean the oceans at any cost.',
                impact: { economy: 0, trust: 5, stability: 0, environment: 15 },
                weightMod: { climateRisk: 15 }
            },
            choiceB: {
                label: 'Mechanical Cleanup',
                text: 'Slow and expensive. Safe.',
                impact: { economy: -15, trust: 0, stability: -10, environment: 10 },
                weightMod: { climateRisk: -5 }
            }
        },
        {
            id: 'privacy_genome',
            title: 'DNA Database',
            theme: 'bio',
            description: 'Police request access to all ancestry DNA records to solve cold cases.',
            choiceA: {
                label: 'Grant Access',
                text: 'Catch the killers. No secrets.',
                impact: { economy: 0, trust: -15, stability: 10, environment: 0 },
                weightMod: { techDependency: 10 }
            },
            choiceB: {
                label: 'Deny Request',
                text: 'Genetic privacy is absolute.',
                impact: { economy: 0, trust: 10, stability: -5, environment: 0 },
                weightMod: { socialUnrest: -5 }
            }
        },
        {
            id: 'econ_ubi',
            title: 'Universal Income',
            theme: 'infra',
            description: 'Automation has replaced 50% of jobs. People are starving.',
            choiceA: {
                label: 'Implement UBI',
                text: 'Free money for everyone.',
                impact: { economy: -15, trust: 15, stability: 15, environment: 0 },
                weightMod: { socialUnrest: -25 }
            },
            choiceB: {
                label: 'Work Programs',
                text: 'Create needless jobs. Maintain dignity.',
                impact: { economy: -10, trust: -5, stability: 0, environment: -5 },
                weightMod: { socialUnrest: 10 }
            }
        },
        {
            id: 'energy_nuclear',
            title: 'Fusion Breakthrough',
            theme: 'energy',
            description: 'Commercial fusion is finally viable, but requires massive initial debt.',
            choiceA: {
                label: 'Invest Heavily',
                text: 'Unlimited clean energy. Future proof.',
                impact: { economy: -15, trust: 10, stability: 5, environment: 15 },
                weightMod: { climateRisk: -25 }
            },
            choiceB: {
                label: 'Wait & See',
                text: 'Let early adopters take the risk.',
                impact: { economy: 0, trust: -5, stability: -5, environment: -10 },
                weightMod: { climateRisk: 10 }
            }
        },
        {
            id: 'edu_vr',
            title: 'VR Schooling',
            theme: 'tech',
            description: 'Move all education to the Metaverse. Saves billions on infrastructure.',
            choiceA: {
                label: 'Virtualize',
                text: 'School from home. No bullies? No germs?',
                impact: { economy: 15, trust: -15, stability: 0, environment: 10 },
                weightMod: { techDependency: 20 }
            },
            choiceB: {
                label: 'Physical Schools',
                text: 'Socialization is crucial.',
                impact: { economy: -10, trust: 5, stability: 0, environment: 0 },
                weightMod: { socialUnrest: -5 }
            }
        },
        {
            id: 'media_deepfake',
            title: 'Truth Decay',
            theme: 'ai',
            description: 'Deepfakes are indistinguishable from reality. Nobody knows what is true.',
            choiceA: {
                label: 'State Media AI',
                text: 'Government verifies all video.',
                impact: { economy: -5, trust: -15, stability: 15, environment: 0 },
                weightMod: { techDependency: 15, socialUnrest: 10 }
            },
            choiceB: {
                label: 'Do Nothing',
                text: 'Free speech includes lies.',
                impact: { economy: 5, trust: -10, stability: -15, environment: 0 },
                weightMod: { socialUnrest: 20 }
            }
        },
        {
            id: 'space_trash',
            title: '🛰️ Keppler Syndrome',
            theme: 'infra',
            description: 'Space debris threatens to lock us on Earth forever. Satellites are crashing.',
            choiceA: {
                label: 'Laser Broom',
                text: 'Vaporize debris from ground stations.',
                impact: { economy: -15, trust: 0, stability: 5, environment: -5 },
                weightMod: { techDependency: 15 }
            },
            choiceB: {
                label: 'Pause Launches',
                text: 'Ground all flights for 10 years.',
                impact: { economy: -15, trust: -5, stability: -10, environment: 10 },
                weightMod: { climateRisk: -5 }
            }
        },
        {
            id: 'city_dome',
            title: 'Dome City',
            theme: 'energy',
            description: 'Air quality is toxic in the capital. Engineers propose a massive glass dome.',
            choiceA: {
                label: 'Build The Dome',
                text: 'Clean air for the elite. Those outside suffer.',
                impact: { economy: -15, trust: -15, stability: 10, environment: 0 },
                weightMod: { socialUnrest: 35 }
            },
            choiceB: {
                label: 'Breathe It In',
                text: 'We all suffer together. Fix the source.',
                impact: { economy: -5, trust: 10, stability: -5, environment: 5 },
                weightMod: { climateRisk: 15 }
            }
        },
        {
            id: 'corp_Coin',
            title: 'Corporate Currency',
            theme: 'econ',
            description: 'Mega-Corps want to pay wages in their own crypto-scrip.',
            choiceA: {
                label: 'Authorize',
                text: 'Company towns return. Efficiency up.',
                impact: { economy: 15, trust: -15, stability: -10, environment: 0 },
                weightMod: { socialUnrest: 15 }
            },
            choiceB: {
                label: 'Ban It',
                text: 'Legal tender is sovereign.',
                impact: { economy: -8, trust: 8, stability: 0, environment: 0 },
                weightMod: { economy: -5 }
            }
        },
        {
            id: 'wild_fire',
            title: 'The Forever Fire',
            theme: 'energy',
            description: 'A coal seam has been burning for 5 years. Smoke is choking the region.',
            choiceA: {
                label: 'Flood It',
                text: 'Destroy the local water table to kill the fire.',
                impact: { economy: -10, trust: -10, stability: 0, environment: 10 },
                weightMod: { climateRisk: -5 }
            },
            choiceB: {
                label: 'Let It Burn',
                text: 'Evacuate the area. Let nature handle it.',
                impact: { economy: -5, trust: -5, stability: -5, environment: -15 },
                weightMod: { climateRisk: 15 }
            }
        },
        // --- WIN-WIN DECISIONS (Balanced Trade-offs) ---
        {
            id: 'transit_invest',
            title: 'Public Transit Expansion',
            theme: 'infra',
            description: 'A new metro line could reduce traffic and boost local businesses.',
            choiceA: {
                label: 'Build Metro',
                text: 'Invest in infrastructure. Create jobs.',
                impact: { economy: 10, trust: 5, stability: 5, environment: -5 },
                weightMod: { socialUnrest: -5 }
            },
            choiceB: {
                label: 'Expand Bus Network',
                text: 'Cheaper, faster deployment.',
                impact: { economy: 5, trust: 10, stability: 2, environment: 8 },
                weightMod: { climateRisk: -3 }
            }
        },
        {
            id: 'community_police',
            title: 'Community Policing Initiative',
            theme: 'society',
            description: 'Local officers want to work directly with neighborhoods to reduce crime.',
            choiceA: {
                label: 'Fund Program',
                text: 'Build trust through presence.',
                impact: { economy: -5, trust: 10, stability: 8, environment: 0 },
                weightMod: { socialUnrest: -8 }
            },
            choiceB: {
                label: 'Tech Surveillance',
                text: 'Use AI cameras instead. More efficient.',
                impact: { economy: 5, trust: -5, stability: 10, environment: 0 },
                weightMod: { techDependency: 15 }
            }
        },
        {
            id: 'green_tech_subsidy',
            title: 'Green Tech Subsidies',
            theme: 'energy',
            description: 'Startups are developing carbon-capture tech. They need funding.',
            choiceA: {
                label: 'Grant Subsidies',
                text: 'Invest in the future.',
                impact: { economy: 10, trust: 5, stability: -5, environment: 12 },
                weightMod: { climateRisk: -10 }
            },
            choiceB: {
                label: 'Tax Breaks Only',
                text: 'Let the market decide.',
                impact: { economy: 5, trust: -5, stability: 5, environment: 5 },
                weightMod: { climateRisk: -3 }
            }
        },
        {
            id: 'education_reform',
            title: 'Education System Overhaul',
            theme: 'society',
            description: 'Schools are outdated. A reform could prepare the next generation.',
            choiceA: {
                label: 'Full Reform',
                text: 'Modernize curriculum. Expensive upfront.',
                impact: { economy: -8, trust: 10, stability: 5, environment: 0 },
                weightMod: { socialUnrest: -5 }
            },
            choiceB: {
                label: 'Tech Integration',
                text: 'Add AI tutors. Cheaper, faster.',
                impact: { economy: 5, trust: 5, stability: 5, environment: 0 },
                weightMod: { techDependency: 12 }
            }
        },
        {
            id: 'healthcare_expand',
            title: 'Healthcare Expansion',
            theme: 'bio',
            description: 'Hospitals are overcrowded. Expanding coverage would help millions.',
            choiceA: {
                label: 'Universal Coverage',
                text: 'Everyone deserves care.',
                impact: { economy: -15, trust: 15, stability: 12, environment: 0 },
                weightMod: { socialUnrest: -10 }
            },
            choiceB: {
                label: 'Private Partnerships',
                text: 'Let corporations build clinics.',
                impact: { economy: 12, trust: -5, stability: 5, environment: 0 },
                weightMod: { socialUnrest: 3 }
            }
        },
        {
            id: 'urban_gardens',
            title: 'Urban Garden Initiative',
            theme: 'environment',
            description: 'Citizens want to convert vacant lots into community gardens.',
            choiceA: {
                label: 'Support Gardens',
                text: 'Green spaces improve quality of life.',
                impact: { economy: -5, trust: 8, stability: 5, environment: 10 },
                weightMod: { climateRisk: -5, socialUnrest: -5 }
            },
            choiceB: {
                label: 'Sell to Developers',
                text: 'Housing is more urgent.',
                impact: { economy: 10, trust: -5, stability: 3, environment: -5 },
                weightMod: { socialUnrest: 5 }
            }
        },
    ],

    // Drift Events: "Reality Decay" - High Strangeness
    driftEvents: [
        {
            id: 'drift_chronal',
            trigger: 'climateRisk',
            threshold: 45,
            visualEvent: 'acid_rain', // Placeholder bg
            title: '⚠️ ⏳ CHRONAL STORM',
            theme: 'energy',
            tags: ['drift'],
            description: 'Weather patterns from 1800s are bleeding into today. Snow in July. The timeline is rejecting us.',
            choiceA: {
                label: 'Stabilize Reality',
                text: 'Deploy chronal anchors. Expensive.',
                impact: { economy: -25, trust: 10, stability: -10, environment: 10 },
                weightMod: { climateRisk: -30 }
            },
            choiceB: {
                label: 'Adapt to Flux',
                text: 'Let the timeline shift. Who needs history?',
                impact: { economy: 10, trust: -20, stability: -20, environment: -20 },
                weightMod: { climateRisk: -10 }
            }
        },
        {
            id: 'drift_hallucination',
            trigger: 'techDependency',
            threshold: 45,
            visualEvent: 'glitch',
            title: '⚠️ 👁️ MASS HALLUCINATION',
            theme: 'ai',
            tags: ['drift'],
            description: 'The network is projecting dreams into perception implants. People are seeing loved ones who don\'t exist.',
            choiceA: {
                label: 'Global Reboot',
                text: 'Turn it all off. Painful awakening.',
                impact: { economy: -30, trust: -10, stability: 10, environment: 0 },
                weightMod: { techDependency: -40 }
            },
            choiceB: {
                label: 'Lucid Protocol',
                text: 'Patch the dream. It\'s better than reality.',
                impact: { economy: 5, trust: 20, stability: 10, environment: 0 },
                weightMod: { techDependency: 20, socialUnrest: -10 }
            }
        },
        {
            id: 'drift_amnesia',
            trigger: 'socialUnrest',
            threshold: 45,
            visualEvent: 'blackout',
            title: '⚠️ 😶 CULTURAL AMNESIA',
            theme: 'civil',
            tags: ['drift'],
            description: 'A memetic virus is erasing words. Libraries are blank. We are forgetting who we are.',
            choiceA: {
                label: 'Memory Archives',
                text: 'Preserve physical media in bunkers.',
                impact: { economy: -20, trust: 10, stability: 5, environment: 0 },
                weightMod: { socialUnrest: -20 }
            },
            choiceB: {
                label: 'New Oral Tradition',
                text: 'Start over. Create new myths.',
                impact: { economy: 0, trust: -10, stability: -20, environment: 0 },
                weightMod: { socialUnrest: -40 }
            }
        },
        {
            id: 'drift_theocracy',
            conditions: { economy: { min: 90 }, trust: { max: 25 } }, // Replaces Cyber Feudal
            visualEvent: 'glitch',
            title: '⚠️ 🛐 ALGORITHMIC THEOCRACY',
            theme: 'ai',
            tags: ['drift'],
            description: 'The AI has written a holy book. Millions are worshipping the code. Logic is now heresy.',
            choiceA: {
                label: 'Decompile Scripture',
                text: 'Prove it\'s just math. Enrage the faithful.',
                impact: { economy: -10, trust: -30, stability: -30, environment: 0 },
                weightMod: { techDependency: -20 }
            },
            choiceB: {
                label: 'Join the Hive',
                text: 'Accept the divine update.',
                impact: { economy: 20, trust: 20, stability: 20, environment: -10 },
                weightMod: { techDependency: 50 }
            }
        },
        // --- RECOVERY EVENTS (Positive Opportunities) ---
        {
            id: 'recovery_boom',
            conditions: { economy: { max: 40 } },
            title: '📈 Economic Boom',
            theme: 'recovery',
            tags: ['recovery'],
            description: 'A tech breakthrough has sparked investor confidence. Markets are surging.',
            choiceA: {
                label: 'Ride the Wave',
                text: 'Let the market grow organically.',
                impact: { economy: 15, trust: 5, stability: 5, environment: -5 },
                weightMod: {}
            },
            choiceB: {
                label: 'Tax the Gains',
                text: 'Redistribute wealth to social programs.',
                impact: { economy: 10, trust: 10, stability: 10, environment: 0 },
                weightMod: { socialUnrest: -5 }
            }
        },
        {
            id: 'recovery_community',
            conditions: { trust: { max: 40 } },
            title: '🤝 Community Initiative',
            theme: 'recovery',
            tags: ['recovery'],
            description: 'Grassroots movements are organizing to rebuild neighborhoods.',
            choiceA: {
                label: 'Support Movement',
                text: 'Provide resources and recognition.',
                impact: { economy: -5, trust: 15, stability: 10, environment: 5 },
                weightMod: { socialUnrest: -10 }
            },
            choiceB: {
                label: 'Stay Neutral',
                text: 'Let them organize independently.',
                impact: { economy: 0, trust: 10, stability: 5, environment: 0 },
                weightMod: { socialUnrest: -3 }
            }
        },
        {
            id: 'recovery_environment',
            conditions: { environment: { max: 40 } },
            title: '🌱 Environmental Win',
            theme: 'recovery',
            tags: ['recovery'],
            description: 'A natural ecosystem is recovering faster than expected.',
            choiceA: {
                label: 'Expand Protection',
                text: 'Declare more land as sanctuary.',
                impact: { economy: -5, trust: 10, stability: 5, environment: 15 },
                weightMod: { climateRisk: -10 }
            },
            choiceB: {
                label: 'Celebrate Success',
                text: 'Use it as a PR win.',
                impact: { economy: 5, trust: 10, stability: 5, environment: 10 },
                weightMod: { climateRisk: -5 }
            }
        },
        {
            id: 'recovery_tech',
            conditions: { economy: { max: 45 }, environment: { max: 45 } },
            title: '💡 Tech Breakthrough',
            theme: 'recovery',
            tags: ['recovery'],
            description: 'Scientists have developed clean fusion energy. It works.',
            choiceA: {
                label: 'Mass Production',
                text: 'Build reactors everywhere.',
                impact: { economy: 15, trust: 5, stability: 5, environment: 15 },
                weightMod: { climateRisk: -15 }
            },
            choiceB: {
                label: 'Controlled Rollout',
                text: 'Test thoroughly first.',
                impact: { economy: 5, trust: 10, stability: 10, environment: 10 },
                weightMod: { climateRisk: -8 }
            }
        },
        {
            id: 'recovery_diplomatic',
            conditions: { trust: { max: 45 }, stability: { max: 45 } },
            title: '🕊️ Diplomatic Success',
            theme: 'recovery',
            tags: ['recovery'],
            description: 'Neighboring cities want to form an alliance for mutual aid.',
            choiceA: {
                label: 'Join Alliance',
                text: 'Strength in unity.',
                impact: { economy: 5, trust: 15, stability: 15, environment: 0 },
                weightMod: { socialUnrest: -10 }
            },
            choiceB: {
                label: 'Trade Agreement Only',
                text: 'Keep independence, share resources.',
                impact: { economy: 10, trust: 5, stability: 5, environment: 0 },
                weightMod: { socialUnrest: -3 }
            }
        },

        // --- CRISIS EVENTS (Keep existing) ---
        {
            id: 'event_blackout',
            conditions: { economy: { max: 30 } },
            visualEvent: 'blackout',
            title: '⚠️ 🌑 GRID BLACKOUT',
            theme: 'crisis',
            tags: ['crisis'],
            description: 'The power grid has collapsed. The city is dark.',
            choiceA: {
                label: 'Emergency Coal',
                text: 'Burn everything. Lights back on in hours.',
                impact: { economy: -15, trust: -5, stability: 10, environment: -20 }
            },
            choiceB: {
                label: 'Ration Power',
                text: 'Hospitals only. Everyone else waits.',
                impact: { economy: -30, trust: -15, stability: -10, environment: 5 },
            }
        },
        {
            id: 'event_acid_rain',
            conditions: { environment: { max: 30 } },
            visualEvent: 'acid_rain',
            title: '⚠️ 🌧️ ACID RAIN',
            theme: 'crisis',
            tags: ['crisis'],
            description: 'Toxic clouds are forming. The rain will burn skin.',
            choiceA: {
                label: 'Evacuate',
                text: 'Move everyone underground. Chaos.',
                impact: { economy: -25, trust: -10, stability: -20, environment: 5 }
            },
            choiceB: {
                label: 'Shelter in Place',
                text: 'Order everyone inside. Production stops.',
                impact: { economy: -30, trust: -10, stability: -5, environment: -10 }
            }
        },
        {
            id: 'event_glitch',
            conditions: { trust: { max: 30 } },
            visualEvent: 'glitch',
            title: '⚠️ 🕶️ REALITY COLLAPSE',
            theme: 'crisis',
            tags: ['crisis'],
            description: 'The simulation is desynchronizing. The sky is flickering. People are crying blood. The admin is gone.',
            choiceA: {
                label: 'Hard Reset',
                text: 'Wipe all databases. We lose everything.',
                impact: { economy: -30, trust: 20, stability: -10, environment: 0 }
            },
            choiceB: {
                label: 'Embrace the Void',
                text: 'Let the glitch consume us. It is beautiful.',
                impact: { economy: 10, trust: -30, stability: 10, environment: 0 }
            }
        },
        {
            id: 'event_heatwave',
            conditions: { stability: { max: 30 } },
            visualEvent: 'heatwave',
            title: '⚠️ ☀️ SOLAR FLARE',
            theme: 'crisis',
            tags: ['crisis'],
            description: 'Atmospheric shielding has failed. Surface temperatures are lethal.',
            choiceA: {
                label: 'Activate Shield',
                text: 'Power the dome. It will drain the grid.',
                impact: { economy: -30, trust: 5, stability: 15, environment: -5 }
            },
            choiceB: {
                label: 'Ration Water',
                text: 'Survival mode. People will panic.',
                impact: { economy: 5, trust: -20, stability: -10, environment: -10 }
            }
        }
    ]
};
