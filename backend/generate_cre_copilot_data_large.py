import os, random, json
from datetime import date, timedelta
import pandas as pd, numpy as np
from faker import Faker

# ======================================================
# CONFIGURATION
# ======================================================
OUTPUT_DIR = "./data/mock_dim_out"
os.makedirs(OUTPUT_DIR, exist_ok=True)
END_DATE = date.today()
START_DATE = END_DATE - timedelta(days=730)
MONTHS_BACK = 24
random.seed(42); np.random.seed(42)
fake = Faker()

# ======================================================
# HELPERS
# ======================================================
def month_seq(end: date, n_months: int):
    y, m = end.year, end.month
    out = []
    for _ in range(n_months):
        out.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            m = 12; y -= 1
    return list(reversed(out))

def pick(seq): return random.choice(seq)
def bool_p(p): return random.random() < p

# ======================================================
# DIMENSIONS
# ======================================================
markets = [
    {"market_key":1,"market_id":"SATX","market_name":"San Antonio","region":"South Texas","legacy_flag":True},
    {"market_key":2,"market_id":"ATX","market_name":"Austin","region":"Central Texas","legacy_flag":True},
    {"market_key":3,"market_id":"DFW","market_name":"Dallas/Fort Worth","region":"North Texas","legacy_flag":True},
    {"market_key":4,"market_id":"HOU","market_name":"Houston","region":"East Texas","legacy_flag":True},
    {"market_key":5,"market_id":"WTX","market_name":"West Texas","region":"West Texas","legacy_flag":False},
]
dim_market = pd.DataFrame(markets)

# --- Branches (50 total) ---
branches=[]
for m in markets:
    for i in range(1,11):
        branches.append({
            "branch_sk":len(branches)+1,
            "branch_id":f"{m['market_id']}-B{i:02d}",
            "branch_name":f"{m['market_name']} Branch {i}",
            "market_key":m["market_key"],
            "address":fake.street_address(),
            "city":m["market_name"].split('/')[0],
            "state":"TX",
            "open_date":"2019-01-01",
            "legacy_flag":m["legacy_flag"],
            "current_flag":True
        })
dim_branch=pd.DataFrame(branches)

# --- Products (CRE-related) ---
products=[
    ("MTG","Mortgage 30Y","Loan","Fixed",6.8),
    ("HELOC","HELOC Variable","Loan","Variable",7.2),
    ("PL","Personal Loan","Loan","Fixed",10.5)
]
dim_product=pd.DataFrame([
    {"product_key":i+1,"product_group":g,"product_name":n,"product_type":t,
     "rate_type":r,"base_rate":b} for i,(g,n,t,r,b) in enumerate(products)
])

# ======================================================
# FACT TABLES
# ======================================================
months = month_seq(END_DATE, MONTHS_BACK)
regions = [m["region"] for m in markets]

# We’ll create enough variation per month/region/branch to total ~15k rows

# -----------------------------
# 1) PIPELINE (~15k rows)
# -----------------------------
rows=[]
for mn in months:
    for reg in regions:
        branches_in_reg = dim_branch[dim_branch.market_key == dim_market.loc[dim_market.region==reg,"market_key"].values[0]]
        for br in branches_in_reg.itertuples():
            # multiple observations per branch
            for _ in range(3):  
                units=int(max(5,np.random.normal(40,10)))
                approvals=int(units*np.random.uniform(0.55,0.85))
                dollars=float(np.random.normal(units*250000,units*8000))
                rows.append({
                    "month":mn,"region":reg,"branch_id":br.branch_id,
                    "apps_units":units,"approvals_units":approvals,
                    "pipeline_dollars":round(dollars,2)
                })
fact_pipeline=pd.DataFrame(rows)
print(f"fact_pipeline: {len(fact_pipeline):,} rows")

# -----------------------------
# 2) LOANS (~15k rows)
# -----------------------------
rows=[]
for mn in months:
    for reg in regions:
        for prod in ["MTG","HELOC","PL"]:
            for _ in range(5):  # 5 pseudo accounts per region/product/month
                base_bal={"MTG":1.8e8,"HELOC":6e7,"PL":2.5e7}[prod]
                season=1+0.05*np.sin((months.index(mn)/12)*2*np.pi)
                reg_mult={"South Texas":1.0,"Central Texas":0.9,"North Texas":1.15,
                          "East Texas":0.95,"West Texas":0.7}[reg]
                balance=np.random.normal(base_bal*season*reg_mult,base_bal*0.05)
                base_rate={"MTG":6.8,"HELOC":7.2,"PL":10.5}[prod]
                drift=(months.index(mn)-len(months)/2)*0.02
                wa_rate=round(np.random.normal(base_rate+drift,0.15),2)
                rows.append({
                    "month":mn,"region":reg,"product_group":prod,
                    "ending_balance":round(balance,2),"weighted_avg_rate":wa_rate
                })
fact_loans=pd.DataFrame(rows)
print(f"fact_loans: {len(fact_loans):,} rows")

# -----------------------------
# 3) DELINQUENCY (~15k rows)
# -----------------------------
rows=[]
for mn in months:
    for reg in regions:
        for _ in range(20):  # 20 accounts per region per month
            base={"South Texas":1.4,"Central Texas":1.35,"North Texas":1.25,
                  "East Texas":1.5,"West Texas":1.6}[reg]
            trend=0.2*(months.index(mn)/len(months))
            r30=max(0.2,np.random.normal(base+trend,0.25))
            r60=max(0.05,r30*np.random.uniform(0.28,0.38))
            r90=max(0.02,r30*np.random.uniform(0.12,0.20))
            rows+=[{"month":mn,"region":reg,"bucket":b,"delinquency_rate_pct":r}
                   for b,r in zip(["30+","60+","90+"],[round(r30,2),round(r60,2),round(r90,2)])]
fact_delinquency=pd.DataFrame(rows)
print(f"fact_delinquency: {len(fact_delinquency):,} rows")

# -----------------------------
# 4) SHARE OF WALLET (~15k rows)
# -----------------------------
rows=[]
for mn in months[-12:]:
    for reg in regions:
        for _ in range(40):
            comps=np.random.dirichlet([4,3,2,2,1])
            rows.append({
                "month":mn,"region":reg,
                "share_dda":round(comps[0],3),"share_sav":round(comps[1],3),
                "share_mma":round(comps[2],3),"share_cd":round(comps[3],3),
                "share_inv":round(comps[4],3)
            })
fact_share_wallet=pd.DataFrame(rows)
print(f"fact_share_wallet: {len(fact_share_wallet):,} rows")

# -----------------------------
# 5) MACRO (~24 rows)
# -----------------------------
rows=[]; u=3.8; cc=102
for mn in months:
    u=max(3.0,min(6.5,u+np.random.normal(0,0.08)))
    cc=max(85,min(115,cc+np.random.normal(0,1.5)))
    rows.append({"month":mn,"unemployment_rate":round(u,2),
                 "consumer_confidence_idx":int(round(cc))})
dim_macro=pd.DataFrame(rows)

# ======================================================
# WRITE OUTPUTS
# ======================================================
files={
    "dim_market.csv":dim_market,"dim_branch.csv":dim_branch,
    "dim_product.csv":dim_product,"fact_pipeline.csv":fact_pipeline,
    "fact_loans.csv":fact_loans,"fact_delinquency.csv":fact_delinquency,
    "fact_share_wallet.csv":fact_share_wallet,"dim_macro_monthly.csv":dim_macro
}
for n,df in files.items():
    df.to_csv(os.path.join(OUTPUT_DIR,n),index=False)
print(f"✅ Wrote {len(files)} CSVs to {OUTPUT_DIR}")

# ======================================================
# COMPACT JSON for DEMO
# ======================================================
def choose_recent(df,n=3):
    m=sorted(df["month"].unique())[-n:]
    return df[df["month"].isin(m)]

demo={
  "pipeline":choose_recent(fact_pipeline,3).to_dict("records"),
  "delinquency":choose_recent(fact_delinquency,3).to_dict("records"),
  "macro":choose_recent(dim_macro,3).to_dict("records"),
  "products":fact_loans[fact_loans["month"]==fact_loans["month"].max()]
      .rename(columns={"product_group":"product","weighted_avg_rate":"avgRate"})
      [["month","product","region","avgRate"]].to_dict("records")
}
json_path=os.path.join(os.path.dirname(OUTPUT_DIR),"cre_copilot_demo.json")
with open(json_path,"w") as f: json.dump(demo,f,indent=2)
print(f"✅ Wrote JSON for demo: {json_path}")
