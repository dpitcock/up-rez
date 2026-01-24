# Berlin AI Hackathon Manual

<aside>
🏆

**>5k€ Price Pool distributed across cash, hardware & credits.
+ The top 1 team wins free tickets to our [Applied AI Conference](https://conference.techeurope.io/).**

</aside>

## Important Links:

Discord Server - https://discord.gg/brSqTjJVdh

Project Submission Form - https://forms.techeurope.io/submission/berlin-hack

Location: 

https://maps.app.goo.gl/JgZ2C25ms6asjJZK6

## Agenda

### **Saturday**

10:00 - Door’s Open & Networking

10:45 - Opening & Matchmaking

12:30 - Lunch

18:30 - Dinner

### **Sunday**

12:30 - Lunch

**14:00 - Competition Opt-In Deadline**

15:00 - Announcement of Finalists

15:15 - Finalist Pitches

16:30 - Award Ceremony

## **Competition Rules & Submission Guidelines**

To compete in the hackathon and have your project considered by the jury, all participants must adhere to the following rules and submission requirements. Failure to meet these guidelines may result in disqualification.

---

## **Submission Requirements**

To qualify for the final judging, you must

- **Submit your project by** Sunday at 14:00
- **Be a team of max. 5 people**
- **Use min. 3 partner technologies** (listed under resources)
- **Have created your project newly at this hackathon** (boilerplates are allowed)

### What needs to be submitted

**Project Presentation**

- Record a **2-minute video demo** of your project (using Loom or equivalent platform)
- Your presentation must include:
    - Detailed explanation of your solution
    - Demonstration of key features with a live walkthrough

**Open Source Repository**

- Provide a **public GitHub repository** containing your project's source code
- Your repository must include:
    - Comprehensive **README** with setup and installation instructions
    - Clear documentation of all APIs, frameworks, and tools utilized
    - Sufficient technical documentation to enable thorough jury evaluation

---

## **Competition Mode**

Our hackathon features a **two-stage competition format**, culminating in a **live final presentation** event.

### Stage 1: Pre-Selection

- Build anything aligned with your creative vision - complete freedom of topic choice
- **5 finalist teams (3 Open Track Winners, 2 Track Winners)** will advance to the Finalist Stage
- Judging criteria: creativity, technical complexity, with bonus points for effective use of partner technologies

### Stage 2: Finalist Stage

- All finalists will showcase their projects **live before the jury and audience**
- Each team delivers a **5-minute presentation**
- After all presentations, the jury will select the **top 3 winners**
- These top 3 teams will be awarded the Finalist Stage Prizes

## Hackathon Tracks, Side Challenges & Prizes

## Tracks

### [Arbio](https://www.notion.so/2646dbf0dcd780329a09e0fae87475a1?pvs=21) – Property Onboarding Autopilot

Arbio is an agentic AI platform that automates property management operations, turning human-heavy processes into autonomous agent-driven systems.

**🏆 Track Prize: Lufthansa flight ticket of 300€ for each team member**

- Challenge
    
    Onboarding a new property into a vacation rental management platform is an incredibly manual, time-consuming process that can take 15-30 hours of work across multiple teams. Operations must collect hundreds of data points: property details (address, size, amenities, capacity), photos, property-specific access instructions (lockbox locations, gate codes, WiFi networks, parking rules), local regulations and tax requirements, cleaning and linen specifications, guidebook content (appliance instructions, emergency contacts, house rules, local recommendations), integration with smart home devices, calendar setup across multiple booking platforms, pricing strategies, and minimum stay rules. Information arrives in unstructured formats - PDFs, emails, phone calls, photos, handwritten notes - and must be validated, standardized, and entered into multiple systems. Errors in onboarding lead to guest confusion, operational chaos, compliance issues, and poor reviews. The bottleneck in onboarding limits how fast property management companies can scale.
    
- Your Goal
    
    Build an AI agent that can autonomously extract, validate, and structure all necessary information from diverse unstructured sources (documents, emails, photos, websites) to complete property onboarding. The agent should identify missing information, proactively request it from property owners, validate data against compliance requirements, and populate all necessary systems, reducing manual work from days to hours.
    
- Potential Use Cases
    - **Document Intelligence Engine:** Automatically process property owner submissions (lease agreements, insurance docs, floor plans, amenity lists, appliance manuals, HOA rules) to extract structured data. Use OCR and document understanding to pull key details from any format (scanned PDFs, photos, emails). Cross-reference extracted data against required fields and flag inconsistencies or missing information.
    - **Visual Property Analysis:** Analyze property photos to automatically identify amenities (pool, parking, outdoor spaces, appliances, bedroom count, bathrooms), assess photo quality for listing optimization, and detect potential issues (clutter, damage, safety concerns). Generate automated photo enhancement suggestions and identify gaps in visual documentation needed for compelling listings.
    - **Compliance & Regulation Validator:** Research and validate local short-term rental regulations based on property address (permit requirements, occupancy limits, tax obligations, registration deadlines). Cross-check property details against legal requirements and flag potential compliance issues. Generate checklists of required documentation and registration steps specific to each jurisdiction.
    - **Smart Guidebook Generator:** Automatically create comprehensive digital guidebooks by combining property-specific information with local knowledge. Parse appliance manuals, WiFi router labels, and access instructions from photos and documents. Research and include local recommendations (restaurants, attractions, emergency services, transportation) tailored to property location and guest demographics.
    - **Proactive Information Gathering:** When required data is missing or unclear, automatically generate personalized outreach to property owners via email or SMS with specific questions and examples. Parse owner responses using NLP to extract answers and integrate into property records. Track completion status and send intelligent follow-ups until all critical information is collected.
    - **Bottom-Up Ontology Schema Discovery from Onboarding Traces:** Instead of predefining every property attribute upfront, instrument the onboarding process to capture what information actually gets requested, validated, and used. Log every data point collected (structured fields, document extractions, owner conversations), track which fields are universally required vs. property-type-specific vs. rarely used, and identify patterns in missing information requests. For example, after 100 onboardings, discover that "urban apartments always need parking restrictions" while "countryside villas always need septic system details" - patterns that weren't obvious when designing the initial schema. Let Arbio's property data model emerge from real intake experiences rather than upfront assumptions. Track exceptions where standard onboarding flows break (co-living spaces, mixed-use buildings, seasonal rentals) to identify new property archetypes. After accumulating traces from hundreds of properties, the agent can suggest schema refinements: "83% of Berlin properties required noise policy clarification - should we make this a required field?" This creates a feedback loop where each onboarding makes the next one smarter, and the property ontology evolves based on what operators actually need rather than what product managers guessed.

### ChatArmin – AI customer service and marketing for E-Commerce

**🏆 Track Prize:** **6 months John Reed Membership for each team member**

- Challenge
    
    E-commerce support chatbots are a solved problem — at least on the surface. Most systems can answer tickets, fetch orders, and recommend products. But under the hood, they are often slow, expensive, and brittle, relying on oversized prompts, massive context windows, and tightly coupled tools.
    
    This track challenges you to rethink the architecture of a “standard” e-commerce support agent by building it as a lean, reactive, agentic system with access to its own execution environment.
    
    Instead of loading everything into context, your agent should pull what it needs, when it needs it, using tools like filesystem access, bash, and structured data queries.
    
- Your Goal
    
    Build an AI-driven conversational agent for e-commerce support that can resolve customer requests, recommend products, and drive upsell — while demonstrating a fundamentally more efficient and intelligent agent design.
    The focus is not on what the chatbot does, but on how it reasons, retrieves information, and interacts with its environment.
    
    - Key Design Principles
        - Minimal context, maximal reactivity
        - Environment-as-memory (filesystem, logs, cached artifacts)
        - On-demand data access (e.g. text-to-SQL, file reads, shell commands)
        - Clear separation between reasoning, retrieval, and execution
        - Bonus: Workflow-Aware Agents
        - Bonus points for agents that can interpret and execute lightweight, natural-language workflows, effectively turning human-readable logic into agent behavior.
- Examples
    
    “If the customer asks about an order, retrieve it using @GetOrderAction.
    If a tracking link exists, respond with the link.
    If no tracking information is found, escalate to a human agent.”
    
    These workflows can be:
    
    - Parsed and executed dynamically
    - Stored and versioned in the filesystem
    - Modified without retraining or prompt rewrites
    
    What We’ll Evaluate
    
    - Architectural clarity and elegance
    - Effective use of filesystem and shell access
    - Reduced reliance on large prompts or static RAG
    - Responsiveness, cost-efficiency, and reasoning quality
    - How convincingly the system improves over a “normal chatbot”

### Open Innovation

**🏆 Track Prize:** Qualification for the Finalist Stage (3x)

- Challenge
    
    Build whatever you want
    

## Side Challenges

### Best use of [Tower](https://tower.dev/)

**To compete in this challenge you have to:**

- Use [Tower](https://tower.dev/) in your AI Project for Python team collaboration, data access to AI Agents, and Feature Engineering
- Confirm in your project submission that you used it

**🏆 The best use of Tower will win:**

- 5 [Bricks](https://getbrick.app/) for Builders
- $900 worth of Tower credits

## Finalist Stage Prizes

### 1st Place

- 1500 USD OpenAI Credits
- 1500 USD Runpod Credits
- 3-month free Lovable
- 6-months free Tower Team Plan (5 users)
- A free ticket to our [Applied AI Conference](https://conference.techeurope.io/) for all team members
    
    The Applied AI Conf is a one-day, highly curated conference for the people who are actually putting AI into production, Europe’s leading technical founders, engineering leaders, and the global infra and devtools teams powering them.
    
    Speakers will include:
    
    - [**Jacob Lauritzen](https://www.linkedin.com/in/jacob-lauritzen/overlay/about-this-profile/),** CTO of Legora
    - [**Lennard Schmidt**](https://www.linkedin.com/in/lennardschmidt/), CEO of Langdock
    - [**Daniel Khachab**](https://www.linkedin.com/in/danielkhachab/), CEO of Choco
    - [**Nico Bentenrieder**](https://www.linkedin.com/in/nbentenrieder/), CTO of tacto
    - [**Lucas Hild**](https://www.linkedin.com/in/lucashild/), CTO of Knowunity

### 2nd Place

- 1000 USD OpenAI Credits
- 1000 USD Runpod Credits
- 6-months free Tower Team Plan (5 users)

### 3rd Place

- 500 USD OpenAI Credits
- 500 USD Runpod Credits
- 6-months free Tower Team Plan (5 users)

## Resources

### Infrastructure Partners

- [OpenAI](http://openai.com/) **-** Frontier AI Models → Submit your Org ID [here](https://www.notion.so/Hackathon-Manual-Munich-28d6dbf0dcd78048ac09f706e17d5d52?pvs=21). 👇
    - [How to find your Org ID](https://platform.openai.com/docs/guides/production-best-practices#setting-up-your-organization)
    
    ![image.png](attachment:128b3bb2-dbdf-4f06-ae39-44a71a8e2b3b:image.png)
    
- [Lovable](https://lovable.dev/?via=bela) - Coding Agent → Code: **TECHEUROPEBERLIN**
    
    **How it works:**
    
    - The code gives access to Pro Plan 1 (100 credits, value $25) at no cost.
    - It also unlocks all Pro 1 features for the duration of the plan.
    - The code must be redeemed by the end of the event, since the credits are intended for use during the event only.
    
    **How to apply the code:**
    
    1. Go to [https://lovable.dev/](https://lovable.dev/?via=bela)
    2. Log in or create a new account
    3. Once logged in, go to Settings → Plans & Billing
    4. Select Pro Plan 1 (100 credits)
    5. At checkout, enter your discount code: **TECHEUROPEBERLIN**
- [Tower](https://tower.dev/) - Data pipelines for your AI → Code **BERLIN-HACK**
    - **What you get**: Each team gets 2 months of free Tower usage, incl. 5 users and 10,000 free compute minutes/month.
    - **How to redeem** 👇
        
        A team member should [register in Tower](http://app.tower.dev/). Then, under “Account Settings > Teams” that team member should create a new Team and invite all remaining team members. Send the team name and **BERLIN-HACK** Code to [serhii@tower.dev](mailto:serhii@tower.dev) to claim your team benefit.
        
    - **How to use Tower for AI:**
        
        Detailed instructions at [https://learn.tower.dev](https://learn.tower.dev/), technical docs at [https://docs.tower.dev](https://docs.tower.dev/). 
        
        - **Launch** your 1st app in 10 minutes https://docs.tower.dev/docs/getting-started/quick-start
        - Use Claude Code and Tower MCP to **vibe code** ([MCP quickstart](https://docs.tower.dev/docs/getting-started/quickstart-with-mcp)) your first data app
        - **Collaborate** with others on building apps - [use teams](https://docs.tower.dev/docs/using-tower/working-in-teams)
        - Provide agents with **fresh data** (like [here](https://github.com/tower/tower-examples/tree/main/05-write-ticker-data-to-iceberg)). Then run an [agent](https://github.com/tower/tower-examples/tree/main/13-ticker-update-agent) that answers questions about data.
        - Use Tower for **feature engineering** (like [here](https://github.com/tower/tower-demo)).
- [Runpod](https://www.runpod.io/) - GPU Compute → Codes on site

## FAQ

**Will there be any food available in the venue for free or to buy?**

Food (lunch and dinner) is provided for all participants free of charge. Snacks and drinks will also be available throughout the hackathon.

**How about staying over in the venue the whole night, what are the guidelines for that?**

Yes, you can stay overnight at the venue. Bring your own essentials (sleeping bag, pillow, toiletries). Please be respectful of quiet zones and keep the space tidy.

**Do I need to be in a team, or can I participate solo?**

You can join as a solo hacker or form a team of up to **5 people.** Team matchmaking will happen on Saturday after the opening session.

**What exactly needs to be submitted?**

- A **2-minute video demo** (e.g., Loom)
- A **GitHub repository (public!)** with source code, README, documentation, and setup instructions.

**Do we need to use the partner technologies?**

You must use at least **3 provided technologies** (OpenAI, Lovable, Runpod & Tower).

**Where do I find help and announcements during the hackathon?**

Join the **Discord server**: https://discord.gg/brSqTjJVdh – it’s the main place for updates, team finding, and support.