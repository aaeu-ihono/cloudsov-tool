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
                "year": 2016,
                "amount_m": 1470,
                "type": "Capex",
                "label": "$1.6B EU Data Centre Commitment",
                "description": "Amazon announced $1.6B (≈€1.5B) investment in European data centres across Germany, UK, and Ireland to meet growing cloud demand.",
            },
            {
                "year": 2023,
                "amount_m": 7176,
                "type": "Region",
                "label": "€7.8B Germany Expansion",
                "description": "Amazon announced €7.8B investment for a new AWS Region in Germany and $7.8B in Spain — part of a European data sovereignty commitment.",
            },
            {
                "year": 2024,
                "amount_m": 76360,
                "type": "Capex",
                "label": "$83B Group Capex",
                "description": "Amazon FY2024 group capex reached $83B (≈€76B), predominantly for AWS data centre infrastructure. FY2025 guided at over $100B.",
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
                "amount_m": 45,
                "type": "EU Tender",
                "label": "EC Sovereign Cloud Tender — Lot 1",
                "description": "OVHcloud (consortium with Post Telecom & CleverCloud) won Lot 1 of the European Commission's €180M Sovereign Cloud Tender (April 2026).",
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
                "label": "IPCEI-CIS Grant €16.9M",
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
                "label": "ITZBund Federal Cloud Contract €410M",
                "description": "ITZBund (German Federal IT Centre) awarded IONOS a 5-year framework contract (cap €410M) to build an air-gapped enterprise cloud for 200 federal authorities.",
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
                "year": 2024,
                "amount_m": 3000,
                "type": "Parent",
                "label": "Iliad €3B Cloud Commitment",
                "description": "Iliad Group announced a €3B investment commitment across Scaleway, OpCore (data centres), and Kyutai AI lab — the largest single EU cloud parent commitment to date.",
            },
            {
                "year": 2025,
                "amount_m": 430,
                "type": "Infrastructure",
                "label": "OpCore Stake Sale €430M",
                "description": "Iliad sold 50% of OpCore to InfraVia Capital Partners at an €860M enterprise value (deal agreed December 2024, closed April 2025). InfraVia and Iliad jointly committed €2.5B+ over 10 years to build a European hyperscale platform.",
            },
            {
                "year": 2026,
                "amount_m": 45,
                "type": "EU Tender",
                "label": "EC Sovereign Cloud Tender — Lot 3",
                "description": "Scaleway won Lot 3 of the European Commission's €180M Sovereign Cloud Tender (April 2026), strengthening its institutional cloud credentials.",
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
                "amount_m": 644,
                "type": "Acquisition",
                "label": "XM Cyber Acquisition $700M",
                "description": "Schwarz Group acquired Israeli cybersecurity firm XM Cyber for $700M (~€644M) — first major external digital acquisition, signalling ambition to compete with hyperscalers before STACKIT's public launch.",
            },
            {
                "year": 2022,
                "amount_m": 0,
                "type": "Launch",
                "label": "STACKIT Commercial Launch",
                "description": "Schwarz Group (Lidl/Kaufland parent) launched STACKIT commercially under the new Schwarz Digits division. Entirely self-funded — no external investors ever.",
            },
            {
                "year": 2024,
                "amount_m": 11000,
                "type": "Parent",
                "label": "€11B Lübbenau Data Center",
                "description": "Schwarz Group committed €11B to Europe's largest private cloud campus in Lübbenau, Brandenburg: €2.5B construction + €8.5B IT/compute. 200MW, up to 100,000 GPUs. Phase 1 complete end-2027.",
            },
            {
                "year": 2026,
                "amount_m": 45,
                "type": "EU Tender",
                "label": "EC Sovereign Cloud Tender — Lot 2",
                "description": "STACKIT won Lot 2 of the EC's €180M Sovereign Cloud Tender (April 2026) as the only standalone (non-consortium) winner among all EU providers.",
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
                "amount_m": 100,
                "type": "Capex",
                "label": "Amsterdam Twin Data Centres",
                "description": "Deutsche Telekom opened two new data centres in Amsterdam (combined 21,000 m²) under the 'Cloud First' strategy, adding T-Cloud Public's second European region. 'Triple-digit million euro' capex.",
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
                "label": "€210M Cloud Capex 2023",
                "description": "T-Systems allocated €210M to cloud portfolio capex in 2023, focused on sovereign infrastructure and Open Telekom Cloud capacity expansion.",
            },
            {
                "year": 2024,
                "amount_m": 229,
                "type": "Capex",
                "label": "€229M Cloud Capex 2024",
                "description": "T-Systems cloud capex grew to €229M in 2024. Deutsche Telekom group capex reached ~€18B including T-Mobile US, providing a substantial parent capital buffer.",
            },
            {
                "year": 2026,
                "amount_m": 1000,
                "type": "Capex",
                "label": "~€1B Industrial AI Cloud Munich",
                "description": "Deutsche Telekom + T-Systems + NVIDIA investing ~€1B in a Munich Tucherpark data centre: 1,000+ NVIDIA DGX B200 systems, up to 10,000 Blackwell GPUs (0.5 EFLOPS). Partners: SAP, Siemens, Perplexity. Opens Q1 2026.",
            },
            {
                "year": 2026,
                "amount_m": 125,
                "type": "Contract",
                "label": "German Federal AI Cloud >€125M",
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
