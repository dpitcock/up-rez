## 0. Development Environment (Local Data-Pond)
All data sources and Tower pipeline scripts are hosted in the `data-pond/` directory.

- `data-pond/sources/`: Raw datasets for ingestion (CSV, Excel).
- `data-pond/pipelines/`: Role-specific Python scripts to be deployed to Tower.

### Local Testing:
You can run these pipelines locally to verify the logic before deploying to the Tower cloud:
```bash
python3 data-pond/pipelines/demand_pipeline.py
python3 data-pond/pipelines/fit_score_pipeline.py
python3 data-pond/pipelines/timing_pipeline.py
```
## 1. Cloud Deployment
Once verified locally, deploy your pipelines to the Tower managed infrastructure.

### Prerequisites:
1.  **Cargo Env**: Ensure your environment is sourced: `source $HOME/.cargo/env`.
2.  **Auth**: Run `tower login` (using your token from app.tower.dev).

1. **Prepare Towerfile**: Ensure you have a `Towerfile` in the `data-pond/` directory:
```toml
[app]
name = "data-service"
script = "pipelines/demand_pipeline.py"
source = ["pipelines/", "sources/", "requirements.txt"]
```
2. **Add Requirements**: Ensure `data-pond/requirements.txt` includes:
```text
pandas
openpyxl
requests
```
3. **Execute Deploy**:
```bash
# From the UpRez root
cd data-pond
tower deploy
```
4. **Run in Cloud**:
```bash
tower run data-service
```
This will install dependencies (like pandas), run your script, and show the logs directly in your terminal.

---

## 2. Team & Project Setup
1.  **Register**: Sign up at [app.tower.dev](https://app.tower.dev/).
2.  **Claim Speciality**: Send your team name and the code `BERLIN-HACK` to `serhii@tower.dev` to get your compute credits and team plan.
3.  **Create Project**: Create a new project titled `UpRez-Market-Intelligence`.

---

## 2. Pipeline 1: Airport Demand Analysis (PMI Focus)
This pipeline aggregates real-time market pressure for vacation rentals near major hubs (Mallorca/PMI).

### Objective:
Calculate a `demand_multiplier` based on localized booking velocity and supply-side factors (e.g. the ~18k listings identified in `20260124_214456.csv`).

### Steps in Tower:
1.  **Sources**: Upload the `Tourism_seasonality_regional_2024_V5.xlsx` file (found in `initial_data/city-data`) as a Tower Source. This dataset contains month-by-month visitor intensity and regional capacity for the Balearic Islands.
2.  **Pipe Logic (Python)**:
    ```python
    # Example Tower Pipe Logic
    def analyze_demand(market_data):
        hub_velocity = market_data.groupby('airport_code').velocity.mean()
        # Scale to a 1.0 - 1.5 multiplier
        multipliers = (hub_velocity / hub_velocity.max()) * 0.5 + 1.0
        return multipliers.to_dict()
    ```
    *Note: By processing the Excel data, you can replace the hardcoded `1.45x` multiplier in the code with a dynamic value based on the current month's 'Intensity' column for the PMI region.*
3.  **Sink**: Configure a **HTTP Sink** or a **Public API Export** in Tower so our backend (`tower_service.py`) can retrieve these values in real-time.

---

## 3. Pipeline 2: AI Feature Store (Guest Fit)
Standardize unstructured guest data into "AI-Ready" features for our scoring engine.

### Objective:
Engineer the `luxury_conversion_propensity` feature.

### Steps in Tower:
1.  **Feature Definition**:
    *   **Family-Space-Ratio**: `(Property_SQM / Guest_Count)`.
    *   **Luxury-Propensity**: High if `Historical_ADR > 250`.
2.  **Pipeline**: Run a nightly Tower job that processes all current `bookings` and updates these fit-scores for matching.
3.  **Access**: Use the **Tower MCP (Model Context Protocol)** to allow our Concierge Bot to query these engineered features directly.

---

## 4. Pipeline 3: Dynamic Trigger Timing Optimization
Use historical patterns to trigger offers at the "Goldilocks" moment (not too early, not too late).

### Objective:
Identify the `optimal_trigger_days` window for each property tier.

### Steps in Tower:
1.  **Sources**: Upload the reverse-engineered datasets from `initial_data/city-data/`:
    *   `historical_offer_success.csv`: Contains success rates by days-to-arrival.
    *   `historical_property_lead_times.csv`: Contains natural booking windows for different tiers.
2.  **Pipe Logic (Python)**:
    ```python
    def calculate_goldilocks_window(data):
        # Filter for highest completion rate per tier
        # Logic: budget->mid is successful 6-9 days before arrival
        # budget->premium requires more lead time (10-16 days)
        # return {tier: (min_days, max_days)}
    ```
3.  **Webhook Trigger**: Configure Tower to monitor your `bookings` table via MCP. When a booking enters an "Optimal Window" calculated by this pipeline, Tower triggers the UpRez `/webhook/dynamic-trigger` endpoint.

---

## 5. Connecting the Backend
Once your Tower pipelines are live, update the `.env` in the root of the project:

```bash
TOWER_API_KEY=your_tower_api_token
TOWER_DEMAND_PIPE_ID=pipe_abc_123
TOWER_FEATURE_STORE_ID=store_xyz_789
```

## 5. Live Demo Hook
When presenting to the jury, you can trigger a "Live Sync" in the Tower UI.
*   **The Vibe**: "We noticed a sudden spike in arrival demand at **PMI Airport** via our Tower data pipeline. Watch as UpRez automatically increases the priority of luxury villa upgrades to maximize revenue lift."

---

### Project Architecture Flow:
1.  **Data Source** (OTA Market Data) → 
2.  **Tower.dev** (Engineering & Multiplier Logic) → 
3.  **UpRez Backend** (`scoring_service.py`) → 
4.  **Guest Offer Page** (Displaying the "Tower Analysis Live" badge).
