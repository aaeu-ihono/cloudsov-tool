# Financial data for the Financial Consideration page
# Sources: public filings, IPCEI-CIS documentation, EC tender records, analyst estimates
# Revenue in native currency (EUR or USD), all millions unless noted
# Bucket A = publicly disclosed, B = private/estimable, C = undisclosed/embedded

USD_TO_EUR = 0.920  # 2024 annual average

FINANCIAL_PROVIDERS = {
    "AWS": {
        "display_name": "AWS",
        "currency": "USD",
        "cloud_launch_year": 2006,
        "revenue_disclosed": True,
        "bucket": "A",
        "revenue_series": {
            2019: 35026,
            2020: 45370,
            2021: 62202,
            2022: 80096,
            2023: 90757,
            2024: 107577,
        },
        "investment_5yr_eur_m": None,
        "cagr_5yr": 25.2,
        "ipcei_cis": False,
        "ec_tender_2026": False,
        "investment_milestones": [
            {
                "year": 2006,
                "amount_m": 0,
                "type": "Launch",
                "label": "AWS Public Launch",
                "description": "Amazon launched S3 and EC2 as public services, entirely self-funded from operating cash flow — no external capital raise.",
            },
            {
                "year": 2023,
                "amount_m": 7800,
                "type": "Region",
                "label": "€7.8B European Sovereign Cloud",
                "delivered": False,
                "horizon": "through 2040",
                "description": "AWS committed €7.8B through 2040 to the AWS European Sovereign Cloud, whose first region is in Brandenburg, Germany. Reaffirmed on 15 January 2026 when the sovereign cloud went live.",
            },
            {
                "year": 2024,
                "amount_m": 8800,
                "type": "Region",
                "label": "€8.8B AWS Europe (Frankfurt) Region",
                "description": "Announced 19 June 2024: €8.8B in the existing AWS Europe (Frankfurt) Region over 2024 to 2026, to meet demand for cloud services in Germany. This is separate from the European Sovereign Cloud; the two together bring AWS commitments to German cloud infrastructure to €16.6B.",
            },
            {
                "year": 2022,
                "amount_m": 2000,
                "type": "Region",
                "label": "€2B AWS Europe (Milan) Region",
                "description": "Initial planned investment to launch the AWS Europe (Milan) Region in Italy.",
            },
            {
                "year": 2024,
                "amount_m": 1200,
                "type": "Region",
                "label": "€1.2B Milan Region expansion",
                "delivered": False,
                "horizon": "five years from 2024",
                "description": "Announced 5 December 2024: more than €1.2B over five years to expand cloud infrastructure in the Milan Region, on top of the original €2B.",
            },
            {
                "year": 2024,
                "amount_m": 15700,
                "type": "Region",
                "label": "€15.7B AWS Europe (Spain) Region",
                "delivered": False,
                "horizon": "over a decade from 2024",
                "description": "Announced July 2024: €15.7B over a decade for the AWS Europe (Spain) Region in Aragón.",
            },
            {
                "year": 2026,
                "amount_m": 18000,
                "type": "Region",
                "label": "€18B Spain increase",
                "delivered": False,
                "horizon": "through 2035",
                "description": "Announced at MWC in March 2026, taking Amazon's planned Spanish data-centre investment to €33.7B through 2035. The largest single-country cloud commitment in Europe by any provider in this study.",
            },
            {
                "year": 2024,
                "amount_m": 76682,
                "type": "Capex",
                "counts_as_investment": False,
                "label": "Amazon group capex — worldwide, all businesses",
                "description": "Amazon purchases of property and equipment were 82,999 million US dollars in 2024, converted at the ECB annual average rate for 2024 of 0.92389 euro to the dollar. This is the whole of Amazon worldwide, covering retail and fulfilment as well as AWS, and it is one year of spending rather than a multi-year commitment like the others on this chart. Amazon does not split capital expenditure by segment; it states only that the majority of its technology infrastructure investment supports AWS. Source: Amazon Form 10-K 2024.",
            },
        ],
    },
    "OVHcloud": {
        "display_name": "OVHcloud",
        "currency": "EUR",
        # First external sale, not first construction. OVH was founded in 1999 as
        # a web host and began building its own data centres in 2006, but sold no
        # cloud product until the Hosted Private Cloud in 2010.
        # https://corporate.ovhcloud.com/en/company/history/
        "cloud_launch_year": 2010,
        "revenue_disclosed": True,
        "bucket": "A",
        "revenue_series": {
            2020: 632,
            2021: 736,
            2022: 795,
            2023: 884,
            2024: 955,
        },
        "investment_5yr_eur_m": 1500,
        "cagr_5yr": 8.6,
        "ipcei_cis": False,
        "ec_tender_2026": True,
        "investment_milestones": [
            {
                "year": 2006,
                "amount_m": 0,
                "type": "Launch",
                "label": "Bootstrapped Launch",
                "description": "OVH expanded from web hosting to dedicated servers entirely self-funded by founder Octave Klaba — no external capital at this stage.",
            },
            {
                "year": 2015,
                "amount_m": 267,
                "type": "Debt",
                "label": "€267M First Syndicated Debt",
                "description": "First major external debt: €196M revolving credit facility + €107M Euro PP bonds arranged by BNP Paribas / SG / HSBC. Used to fund international data centre expansion.",
            },
            {
                "year": 2016,
                "amount_m": 250,
                "type": "PE/VC",
                "label": "KKR & TowerBrook €250M",
                "description": "Private equity firms KKR and TowerBrook Capital Partners invested €250M in OVH to accelerate international data centre buildout.",
            },
            {
                "year": 2017,
                "amount_m": 400,
                "type": "Debt",
                "label": "€400M Syndicated Loan",
                "description": "5-year €400M syndicated loan arranged by BNP Paribas, Crédit Agricole, HSBC France, and Société Générale to refinance prior debt and fund the global expansion plan.",
            },
            {
                "year": 2021,
                "amount_m": 450,
                "type": "IPO",
                "label": "Euronext Paris IPO €450M",
                "description": "IPO on Euronext Paris (October 2021) raised €450M including overallotment at €18.50/share. Market cap at listing: €3.48B. First major European cloud provider to list publicly.",
            },
            {
                "year": 2022,
                "amount_m": 200,
                "type": "EU Debt",
                "label": "EIB €200M Green Loan",
                "description": "European Investment Bank's first-ever loan to a pure cloud player: €200M credit facility dedicated to building 15 new European data centre sites.",
            },
            {
                "year": 2025,
                "amount_m": 1150,
                "type": "Debt",
                "label": "€1.15B HY Bond & Green Loan",
                "description": "Inaugural €500M high-yield bond (4.75% fixed, BB-/Ba3, due 2030) + €450M EU Taxonomy-aligned green term loan (first by a European cloud player) + €200M RCF.",
            },
            {
                "year": 2026,
                "amount_m": None,
                "type": "EU Tender",
                "counts_as_investment": False,
                "label": "EC Sovereign Cloud framework contract",
                "description": "One of four contracts the European Commission awarded in parallel on 17 April 2026, letting EU institutions buy sovereign cloud services for up to €180M over six years. OVHcloud is part of the Post Telecom consortium with CleverCloud. The Commission published no value for any individual contract, so no figure is shown. This is a contract to supply, not capital the provider committed.",
            },
        ],
    },
    "IONOS": {
        "display_name": "IONOS",
        "currency": "EUR",
        # First external sale, not the rebrand. IONOS Cloud is ProfitBricks,
        # founded in Berlin in 2010 and generally available from 2012. 1&1
        # acquired it in 2017 and renamed it IONOS in 2018, so 2018 dates the
        # name rather than the platform.
        # https://www.datacenterknowledge.com/archives/2012/12/13/profitbricks-looks-to-be-the-2nd-generation-of-iaas
        "cloud_launch_year": 2012,
        "revenue_disclosed": True,
        "bucket": "A",
        "revenue_series": {
            2020: 967,
            2021: 1057,
            2022: 1156,
            2023: 1250,
            2024: 1335,
        },
        "investment_5yr_eur_m": 500,
        "cagr_5yr": 6.6,
        "ipcei_cis": True,
        "ec_tender_2026": False,
        "investment_milestones": [
            {
                "year": 2018,
                "amount_m": 0,
                "type": "Launch",
                "label": "IONOS Cloud Portfolio Launch",
                "description": "IONOS launched its cloud portfolio (rebranded from 1&1 Cloud), backed entirely by parent United Internet AG — no external capital raise.",
            },
            {
                "year": 2017,
                "amount_m": 450,
                "type": "PE/VC",
                "label": "Warburg Pincus €450M for 33.3%",
                "description": "Warburg Pincus acquired 33.33% of 1&1 Internet SE (renamed IONOS) from United Internet for up to €450M, valuing the business at €2.55B — the first major external investor.",
            },
            {
                "year": 2023,
                "amount_m": 447,
                "type": "IPO",
                "label": "Frankfurt IPO €447M",
                "description": "IONOS Group SE listed on the Frankfurt Stock Exchange (February 8, 2023) at €18.50/share, raising ~€447M total proceeds. United Internet retained 63.8%; Warburg Pincus 21.2%.",
            },
            {
                "year": 2023,
                "amount_m": 17,
                "type": "EU Grant",
                "label": "IPCEI-CIS project €16.9M, €6.8M granted",
                "description": "IONOS confirmed IPCEI-CIS beneficiary (approved December 5, 2023): €16.9M total project value, €6.8M German Federal grant. Focus: energy-efficient data centres and distributed cloud-edge infrastructure.",
            },
            {
                "year": 2023,
                "amount_m": 800,
                "type": "Debt",
                "label": "€800M Syndicated Loan",
                "description": "IONOS signed an €800M syndicated loan with nine banks (rate ~4.70%, maturity December 2026) to partially replace the United Internet shareholder loan and strengthen the balance sheet.",
            },
            {
                "year": 2024,
                "amount_m": 410,
                "type": "Contract",
                "counts_as_investment": False,
                "label": "ITZBund federal cloud framework, €410M ceiling",
                "description": "The German Federal IT Centre awarded IONOS a five-year framework contract on 2 April 2024 for an air-gapped private enterprise cloud, certified by the BSI and run inside ITZBund data centres. €410M is a ceiling, not an order: the contract carries no acceptance guarantee, and IONOS states it expects revenue in the low three-digit million range. This is money IONOS earns, not capital it commits.",
            },
        ],
    },
    "Scaleway": {
        "display_name": "Scaleway",
        "currency": "EUR",
        "cloud_launch_year": 2015,
        "revenue_disclosed": False,
        "bucket": "B",
        "revenue_series": {
            2020: 75,
            2021: 90,
            2022: 108,
            2023: 125,
            2024: 145,
        },
        "investment_5yr_eur_m": 400,
        "cagr_5yr": 14.1,
        "ipcei_cis": True,
        "ec_tender_2026": True,
        "investment_milestones": [
            {
                "year": 2015,
                "amount_m": 0,
                "type": "Launch",
                "label": "Scaleway Cloud Rebrand",
                "description": "Online SAS rebranded as Scaleway cloud under Iliad Group (Xavier Niel). No external raise — fully funded by the Iliad conglomerate.",
            },
            {
                "year": 2023,
                "amount_m": 150,
                "type": "EU Grant",
                "label": "IPCEI-CIS Grant ~€150M",
                "description": "Scaleway confirmed as IPCEI-CIS beneficiary (EC approval December 5, 2023): ~€150M from France's €300M national IPCEI allocation (PIA 4 / France Recovery Plan), covering the GPU cluster at Vitry-sur-Seine — the largest external GPU cluster in France.",
            },
            {
                "year": 2025,
                "amount_m": 3000,
                "type": "Parent",
                "label": "iliad €3B AI Commitment",
                "delivered": False,
                "horizon": "no completion date stated",
                "description": "Iliad Group announced a €3B investment commitment across Scaleway, OpCore (data centres), and Kyutai AI lab — the largest single EU cloud parent commitment to date.",
            },
            {
                "year": 2025,
                "amount_m": 440,
                "type": "Disposal",
                "counts_as_investment": False,
                "label": "OpCore stake sale — €440M proceeds",
                "description": "iliad sold 50% of OpCore, its data-centre subsidiary, to InfraVia. Announced 4 December 2024, completed 31 March 2025. This is cash received, not money invested: iliad's H1 2025 results state equity free cash flow of €620M 'before OpCore €440M proceeds and spectrum'. The same slide gives €0.7B of capex financing to add more than 100 MW of capacity. Source: iliad H1 2025 results presentation, 28 August 2025.",
            },
            {
                "year": 2026,
                "amount_m": None,
                "type": "EU Tender",
                "counts_as_investment": False,
                "label": "EC Sovereign Cloud framework contract",
                "description": "One of four contracts the European Commission awarded in parallel on 17 April 2026, under a ceiling of €180M over six years for all four together. No individual contract value was published. This is a contract to supply, not capital the provider committed.",
            },
        ],
    },
    "STACKIT": {
        "display_name": "STACKIT",
        "currency": "EUR",
        "cloud_launch_year": 2022,
        "revenue_disclosed": False,
        "bucket": "C",
        "revenue_series": {
            2022: 40,
            2023: 80,
            2024: 150,
        },
        "investment_5yr_eur_m": 1000,
        "cagr_5yr": None,
        "ipcei_cis": False,
        "ec_tender_2026": True,
        "investment_milestones": [
            {
                "year": 2021,
                "amount_m": 592,
                "type": "Acquisition",
                "label": "XM Cyber acquisition, €592M",
                "description": "Schwarz Group acquired the Israeli security firm XM Cyber for 700 million US dollars, announced 22 November 2021. Converted at the ECB annual average rate for 2021, 0.845494 euro to the dollar. Its first large external digital acquisition, made before STACKIT launched publicly. This is security software rather than cloud infrastructure.",
            },
            {
                "year": 2022,
                "amount_m": 0,
                "type": "Launch",
                "label": "STACKIT Commercial Launch",
                "description": "Schwarz Group (Lidl/Kaufland parent) launched STACKIT commercially under the new Schwarz Digits division. Entirely self-funded — no external investors ever.",
            },
            {
                "year": 2025,
                "amount_m": 11000,
                "type": "Parent",
                "label": "€11B Lübbenau Data Center",
                "delivered": False,
                "horizon": "first phase complete end 2027",
                "description": "Schwarz Group committed €11B to Europe's largest private cloud campus in Lübbenau, Brandenburg: €2.5B construction + €8.5B IT/compute. 200MW, up to 100,000 GPUs. Phase 1 complete end-2027.",
            },
            {
                "year": 2026,
                "amount_m": 5600,
                "type": "Parent",
                "label": "€5.6B Dummerstorf Data Center",
                "delivered": False,
                "horizon": "240 MW by 2033, 1 GW prospect by 2045",
                "description": "Announced 27 August 2026 with the state of Mecklenburg-Vorpommern: up to €5.6B by 2033 for a 240 MW data centre, with an expansion prospect of a 1 GW grid connection by 2045. With Lübbenau this takes Schwarz Digits to €16.6B, the same figure AWS has committed to German cloud infrastructure.",
            },
            {
                "year": 2026,
                "amount_m": None,
                "type": "EU Tender",
                "counts_as_investment": False,
                "label": "EC Sovereign Cloud framework contract",
                "description": "One of four contracts the European Commission awarded in parallel on 17 April 2026, under a ceiling of €180M over six years for all four together. STACKIT bid alone rather than as a consortium. No individual contract value was published. This is a contract to supply, not capital the provider committed.",
            },
        ],
    },
    "T-Cloud Public": {
        "display_name": "T-Cloud Public",
        "currency": "EUR",
        "cloud_launch_year": 2016,
        "revenue_disclosed": False,
        "bucket": "B",
        "revenue_series": {
            2020: 180,
            2021: 210,
            2022: 245,
            2023: 290,
            2024: 340,
        },
        "investment_5yr_eur_m": 600,
        "cagr_5yr": 13.6,
        "ipcei_cis": True,
        "ec_tender_2026": False,
        "investment_milestones": [
            {
                "year": 2016,
                "amount_m": 100,
                "type": "Debt",
                "label": "Biere Phase 2 Syndicated Loan",
                "description": "T-Systems secured a 'triple-digit million euro' syndicated loan from KfW IPEX-Bank, BayernLB, and LBBW to expand the Biere data centre (Germany's largest) by 3 modules and 45,000 additional servers.",
            },
            {
                "year": 2016,
                "amount_m": 0,
                "type": "Launch",
                "label": "T-Cloud Public Launch",
                "description": "T-Systems (Deutsche Telekom subsidiary) launched T-Cloud Public, backed entirely by Deutsche Telekom (€111.6B revenue parent) — no external capital ever raised.",
            },
            {
                "year": 2021,
                "amount_m": None,
                "type": "Capex",
                "label": "Amsterdam twin data centre — amount not published",
                "description": "Deutsche Telekom opened a twin data centre at Aalsmeer and Almere near Amsterdam, 21,000 square metres, in productive operation from June 2021. It became Open Telekom Cloud second region, mirroring Biere and Magdeburg about 500 km away. Deutsche Telekom published no cost for it. A figure of 100 million previously shown here came from a statement that the wider Cloud First strategy would top three-digit million euros, which is a programme-wide range and not this site.",
            },
            {
                "year": 2023,
                "amount_m": None,
                "type": "EU Grant",
                "label": "IPCEI-CIS Participant",
                "description": "T-Systems confirmed as an IPCEI-CIS beneficiary (EC approval December 2023) under the 8ra/EdgeConnect project. Germany committed the largest national IPCEI allocation (~€428M total); T-Systems' individual share not published.",
            },
            {
                "year": 2023,
                "amount_m": 210,
                "type": "Capex",
                "label": "€210M Systems Solutions cash capex",
                "description": "Cash capex before spectrum investment for the whole Systems Solutions segment, not for cloud alone. Deutsche Telekom publishes no capex figure for Open Telekom Cloud. Source: Deutsche Telekom Annual Report 2024, Systems Solutions segment.",
            },
            {
                "year": 2024,
                "amount_m": 229,
                "type": "Capex",
                "label": "€229M Systems Solutions cash capex",
                "description": "Cash capex before spectrum investment for the whole Systems Solutions segment. Deutsche Telekom attributes the rise to 'higher cash capex in the Cloud portfolio area' but publishes no cloud figure of its own. Source: Deutsche Telekom Annual Report 2024, Systems Solutions segment.",
            },
            {
                "year": 2025,
                "amount_m": 1000,
                "type": "Capex",
                "label": "€1B Industrial AI Cloud Munich, with NVIDIA",
                "description": "Deutsche Telekom + T-Systems + NVIDIA investing ~€1B in a Munich Tucherpark data centre: 1,000+ NVIDIA DGX B200 systems, up to 10,000 Blackwell GPUs (0.5 EFLOPS). Partners: SAP, Siemens, Perplexity. Opens Q1 2026.",
            },
            {
                "year": 2026,
                "amount_m": 125,
                "type": "Contract",
                "counts_as_investment": False,
                "label": "German federal AI cloud, >€125M share",
                "description": "T-Systems + SAP won the German federal government's €250M central AI cloud contract. T-Systems leads with >€125M share, deploying the 'KIPITZ' AI platform for 200+ federal agencies over 4 years.",
            },
        ],
    },
    "Hetzner": {
        "display_name": "Hetzner",
        "currency": "EUR",
        "cloud_launch_year": 2017,
        "revenue_disclosed": False,
        "bucket": "B",
        "revenue_series": {
            2020: 200,
            2021: 260,
            2022: 330,
            2023: 420,
            2024: 510,
        },
        "investment_5yr_eur_m": 200,
        "cagr_5yr": 20.6,
        "ipcei_cis": False,
        "ec_tender_2026": False,
        "investment_milestones": [],
    },
}

# EU sovereign cloud market projections to 2030
# Source: IDC, Gartner, EC Digital Decade targets; EU market = cloud spend by EU entities
MARKET_2030 = {
    "pessimistic_eur_m": 24000,
    "base_eur_m": 30000,
    "optimistic_eur_m": 40000,
    "aws_2030_est_eur_m": 250000,
    "eu_market_2024_eur_m": 8500,
}


# ---------------------------------------------------------------------------
# Parent company revenue.
#
# Every provider sits inside a parent. This records what that parent earns, so
# the backing behind a provider can be seen separately from the provider's own
# cloud business. The two are never mixed: a parent figure is never used as a
# substitute for a cloud figure.
#
# Every value below was read from the primary document, not from a summary.
# Fiscal years do not align -- Schwarz closes in February, OVH Groupe in
# August, and iliad's most recent published actual is 2023 -- so `period`
# records what each figure actually covers.
# ---------------------------------------------------------------------------
PARENT_REVENUE = {
    "AWS": {
        "parent": "Amazon.com, Inc.",
        "value_m": 637959,
        "currency": "USD",
        "period": "FY2024 (calendar)",
        "main_business": "Retail",
        "note": "Consolidated net sales. North America 387,497 plus International "
                "142,906 plus AWS 107,556. AWS is 16.9 per cent of the total.",
        "source": "https://s2.q4cdn.com/299287126/files/doc_financials/2025/ar/"
                  "Amazon-2024-Annual-Report.pdf",
    },
    "STACKIT": {
        "parent": "Schwarz Group",
        "value_m": 185600,
        "currency": "EUR",
        "period": "FY2025, ended 28 February 2026",
        "main_business": "Retail",
        "note": "Prior year 175.4bn. Group plans investments of more than 10bn in "
                "the current year, about 5bn of it in Germany.",
        "source": "https://gruppe.schwarz/en/press/archive/2026/companies-of-schwarz-"
                  "group-generate-185.6-billion-euros-in-revenue-and-drive-growth-"
                  "with-investments-in-excess-of-10-billion-euros",
    },
    "T-Cloud Public": {
        "parent": "Deutsche Telekom AG",
        "value_m": 115769,
        "currency": "EUR",
        "period": "FY2024 (calendar)",
        "main_business": "Telecommunications",
        "note": "Net revenue, up 3.4 per cent from 111,985 in 2023. Service revenue "
                "was 96.5bn of the total.",
        "source": "https://report.telekom.com/annual-report-2024/management-report/"
                  "development-of-business-in-the-group/results-of-operations-of-the-group.html",
    },
    "Scaleway": {
        "parent": "iliad Group",
        "value_m": 9240,
        "currency": "EUR",
        "period": "FY2023 (calendar)",
        "main_business": "Telecommunications",
        "note": "Consolidated revenues, up 10.4 per cent. The group targeted 10bn "
                "for 2024, but that is guidance rather than a reported actual. "
                "iliad was delisted in 2022-23 and reports for bond covenants only.",
        "source": "https://www.globenewswire.com/news-release/2024/03/14/2845988/0/en/"
                  "Press-Release-A-year-of-exceptional-growth.html",
    },
    "IONOS": {
        "parent": "United Internet AG",
        "value_m": 6329.2,
        "currency": "EUR",
        "period": "FY2024 (calendar)",
        "main_business": "Telecommunications and web services",
        "note": "Total group sales, against 6,213.2 in 2023. United Internet retains "
                "a majority holding in IONOS after the 2023 listing.",
        "source": "https://www.united-internet.de/fileadmin/user_upload/"
                  "United_Internet_Consolidated_Financial_Statements_FY_2024.pdf",
    },
    "OVHcloud": {
        "parent": "OVH Groupe",
        "value_m": 1084.6,
        "currency": "EUR",
        "period": "FY2025, ended 31 August 2025",
        "main_business": "Cloud -- no business outside it",
        "note": "OVH Groupe is the listed holding company for the cloud business and "
                "essentially nothing else, so its revenue is the cloud revenue. "
                "Klaba family held 79.0 per cent of capital at 5 December 2025.",
        "source": "https://corporate.ovhcloud.com/en/newsroom/news/financial-results-fy25/",
    },
}
