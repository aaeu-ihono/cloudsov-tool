# CloudSov Benchmarking Plan

## Test Profiles

Eight benchmark profiles are adopted for this study. Profiles 1–5 follow the Phoronix Test Suite
methodology used by Lowet (Nexxwave, January 2024). Profiles 6–8 extend the framework to cover
Gillam et al.'s (2013) Network category and the provisioning lifecycle dimensions.

All Phoronix profiles run on **Ubuntu 22.04 LTS**, minimum 3 runs per profile, standard deviation
threshold < 2.5%, up to 40 runs to achieve stability.

| # | Gillam Category | Profile / Tool | Metric | Description | Technical Detail |
|---|---|---|---|---|---|
| 1 | Memory IO | `pts/stream` | MB/s | The rate at which the processor can interact with memory is one of the key system bottlenecks — a slow memory bus limits performance regardless of CPU speed | Four large arrays (bigger than the CPU cache) are run through four operations: <br>- **COPY** (`C = A`): takes every value from one list and copies it into another — raw read/write speed with no calculation involved <br>- **SCALE** (`B = scalar × C`): same as COPY but every value is multiplied by a fixed number before writing — one read, one calculation, one write <br>- **ADD** (`C = A + B`): reads from two lists and adds them together before writing — more demanding because the processor must pull from two memory locations at once <br>- **TRIAD** (`A = B + scalar × C`): multiplies one array by a constant and adds it to another — the most demanding operation and closest to real workload patterns |
| 2 | CPU — single-core | `pts/hint` | MIPS | Individual tasks that run in sequence — such as processing a single request or executing a script — depend entirely on how fast one processor core works. A slow single core means slower response times even when the machine has many cores available | The HINT (Hierarchical INTegration from the U.S DoE) algorithm continuously subdivides a number range and calculates progressively finer estimates of an integral. It counts how many correct integer operations it completes per second, running until it hits the performance ceiling of one core |
| 3 | CPU — multi-core | `pts/compress-7zip` | MIPS | When many tasks run at the same time, all processor cores work together in parallel. This measures how effectively the system performs under full combined load — revealing whether extra cores deliver real gains or whether they bottleneck on shared resources | 7-Zip uses all available cores simultaneously to compress and then decompress a 32 MB block of data, repeating this in a loop and reporting how many millions of instructions per second it completes for both compression and decompression |
| 4 | Disk IO | `pts/postmark` | TPS | Storage access speed determines how quickly data can be read from and written to disk — a bottleneck here affects databases, mail servers, and any application that handles many small files | PostMark creates 500 small files (5–512 KB) and then performs 25,000 mixed operations — reads, writes, appends, and deletes — against all of them simultaneously, recording how many transactions complete per second |
| 5 | Application | `pts/apache` | Req/s | This simulates real users hitting a web server at the same time. It shows how many requests the system can serve per second before it starts to struggle — a direct measure of how many users the instance could support at once | Apache HTTPD is started on the instance. A load generator (Bombardier) then fires HTTP requests from multiple concurrent clients over a fixed time window and counts how many requests per second the server successfully handled |
| 6 | Network bandwidth | `iperf3` | Mbit/s | The speed at which data moves between two machines in the same data centre affects every multi-component application — a slow internal network makes services feel unresponsive even when individual machines are fast | One instance runs as a server, a second instance in the same provider region runs as a client. The client sends data to the server continuously for 30 seconds and records the average throughput in each direction (upload and download). This is repeated 3 times |
| 7 | Lifecycle — Boot | boot time | seconds | When a new cloud instance is ordered, the provider must start it up before it can be used. This time is billed but produces no output — the shorter it is, the less you pay for nothing | A timestamp is recorded at the exact moment the API call to create the instance is sent. A second timestamp is recorded when the first successful SSH login to the running instance completes. The difference between the two is the boot time |
| 8 | Lifecycle — Setup | setup time | seconds | Even after a machine is running, software must be installed before any work can begin. This setup phase is a hidden cost that every deployment incurs — measured here so it can be compared fairly across providers | A timestamp is recorded at the moment the first SSH session opens on the running instance. The Phoronix Test Suite is then installed from the Ubuntu package repository. A second timestamp is recorded the moment the installation completes and the tool responds to a version check |

Profiles 7 and 8 correspond to the Boot and Setup stages of Gillam et al.'s value-for-money
lifecycle model: **Request → Boot → Setup → Run → Release**.

---

## Machine Selection

### Benchmark Tier: 2 vCPU / 8 GB RAM

A single equivalent tier is used across all six providers to ensure comparability. This tier was
selected as the smallest configuration available consistently across all providers without
overprovisioning or burstable CPU credits.

| Provider | Instance | vCPU | RAM | Storage | Region | EUR/hr (approx) |
|---|---|---|---|---|---|---|
| OVHcloud | b3-8 | 2 | 8 GB | 50 GB local NVMe | GRA — Gravelines, France | €0.060 |
| Scaleway | POP2-2C-8G | 2 | 8 GB | SBS block storage (NVMe) | PAR — Paris, France | €0.074 |
| IONOS | 2 vCPU / 8 GB flexible | 2 | 8 GB | 100 GB SSD Premium | Frankfurt, Germany | ~€0.041 |
| STACKIT | g1a.2d | 2 | 8 GB | Block storage (NVMe-class) | EU01 — Germany South | €0.098 |
| T-Cloud Public | s3.large.4 | 2 | 8 GB | EVS block storage | EU-DE — Germany | €0.114 |
| AWS | m6i.large | 2 | 8 GiB | EBS gp3 (100 GB) | eu-central-1 — Frankfurt | ~€0.106 |

### Instance Selection Notes

**OVHcloud b3-8**
Current-generation instance on AMD EPYC (Milan). Uses locally attached NVMe storage — physically
on the host, not network-attached. This is a genuine product characteristic: OVHcloud is the only
provider in this set offering local NVMe at this tier. The difference will be visible in
pts/postmark results and is noted rather than corrected.

**Scaleway POP2-2C-8G**
Dedicated AMD EPYC vCPU (no overprovisioning). Block storage (SBS) is network-attached NVMe.
Separate billing for block storage: ~€0.087/GB/month (100 GB adds ~€8.70/mo).

**IONOS 2vCPU / 8GB flexible**
IONOS uses a component model rather than fixed flavors. The configuration is defined as
2 vCPU (shared) + 8 GB RAM + 100 GB SSD Premium. Dedicated-core options also available
(AMD EPYC Milan at ~€0.147/hr for 2 core / 8 GB) if CPU stability is required.

**STACKIT g1a.2d**
The `d` suffix denotes no CPU overprovisioning — equivalent to dedicated vCPU. AMD Rome/Milan
processor. Block storage is billed separately; Premium-Performance tier (NVMe-class) delivers
up to 60,000 IOPS / 1,500 MB/s. EU01 region is in Neckarsulm/Ellhofen, Germany.

**T-Cloud Public s3.large.4**
Intel Xeon Gold 6278C, KVM hypervisor. Storage via EVS (Elastic Volume Service), billed
separately. The `4` suffix denotes the RAM:vCPU ratio (4 GB per vCPU). EU-DE region
is Deutsche Telekom's Germany datacenter.

**AWS m6i.large**
Intel Ice Lake, always-on dedicated vCPU. t3 family excluded: t3 uses CPU credits and throttles
under sustained load — unsuitable for continuous benchmark workloads. EBS gp3 storage billed
separately (~$0.08/GB/month in eu-central-1).

---

## Storage Note

| Provider | Storage Type | Expected Impact on pts/postmark |
|---|---|---|
| OVHcloud | Local NVMe (host-attached) | Higher TPS — no network latency |
| Scaleway | Network-attached NVMe (SBS) | Lower TPS — adds ~sub-ms network hop |
| IONOS | Network-attached SSD Premium | Lower TPS |
| STACKIT | Network-attached NVMe-class block | Lower TPS |
| T-Cloud Public | Network-attached EVS | Lower TPS |
| AWS | Network-attached EBS gp3 | Lower TPS |

OVHcloud's local NVMe is a real product differentiator, not a test error. Results are reported
as-is with this note in the thesis.

---

## Data Collection Methodology

- **OS**: Ubuntu 22.04 LTS on all instances
- **Profiles 1–5**: Phoronix Test Suite v10.8.4+ — minimum 3 runs, SD < 2.5%, up to 40 runs
- **Profile 6 (iperf3)**: iperf3 client/server pair within the same provider region, TCP mode,
  3 × 30-second windows, report min/avg/max throughput
- **Profile 7 (boot time)**: timestamp at API instance-create call → timestamp at first
  successful SSH connection; 5 measurements per instance type
- **Profile 8 (setup time)**: timestamp at first SSH → timestamp when `pts-core --version`
  returns successfully after full install; 5 measurements per instance type
- **Runs for variability**: 3 measurements minimum; max/min/avg reported per Gillam et al.'s
  Table 11 approach
- **Data storage**: JSON files per provider under `backend/benchmarking/data/`

---

## Data Directory Structure (planned)

```
benchmarking/
├── BENCHMARK_PLAN.md        ← this file
└── data/
    ├── ovhcloud/
    │   ├── stream.json
    │   ├── hint.json
    │   ├── compress_7zip.json
    │   ├── postmark.json
    │   ├── apache.json
    │   ├── iperf3.json
    │   └── provisioning.json
    ├── scaleway/
    ├── ionos/
    ├── stackit/
    ├── tcloud/
    └── aws/
```

Each JSON file contains: `provider`, `instance`, `region`, `os`, `profile`, `unit`,
`runs` (array of measurements), `min`, `avg`, `max`, `sd`, `date_collected`, `source`.

---

## Data Sources and Availability

### Coverage Matrix

| Provider | pts/stream | pts/hint | pts/compress-7zip | pts/postmark | pts/apache | iperf3 | boot time | setup time |
|---|---|---|---|---|---|---|---|---|
| OVHcloud | ⚠ ref | ⚠ ref | ⚠ ref | ⚠ ref | ⚠ ref | ✓ | ✗ run | ✗ run |
| Scaleway | ⚠ chart | ⚠ chart | ⚠ chart | ⚠ chart | ⚠ chart | ✓ | ✗ run | ✗ run |
| IONOS | ✗ run | ✗ run | ✗ run | ✗ run | ✗ run | ✗ run | ✗ run | ✗ run |
| STACKIT | ✗ run | ✗ run | ✗ run | ✗ run | ✗ run | ✗ run | ✗ run | ✗ run |
| T-Cloud Public | ✗ run | ✗ run | ✗ run | ✗ run | ✗ run | ✓ | ✗ run | ✗ run |
| AWS | ✗ run | ✗ run | ✗ run | ✗ run | ✗ run | ✓ ⚠ | ✗ run | ✗ run |

**Legend:**
- ✓ = data collected, correct instance, compatible tool, stored in JSON
- ✓ ⚠ = data collected but with a methodology note (AWS iperf3: mixed thread counts make the average misleading — use 2-thread cluster ~4,728 Mbit/s for fair comparison)
- ⚠ ref = reference numbers exist (Nexxwave Jan 2023) but measured on a **different instance** (2c/4GB, not our b3-8 2c/8GB) — not usable as-is, must run on b3-8 to replace
- ⚠ chart = data exists for correct instance (Nexxwave Jan 2024) but **rendered as image charts only** — numbers must be read visually in browser or obtained from Kris Lowet directly
- ✗ run = **no compatible data found anywhere** — must be measured by running the benchmark on a provisioned instance

**What still needs to be run:**

| Provider | Profiles to run |
|---|---|
| OVHcloud | pts/stream, pts/hint, pts/compress-7zip, pts/postmark, pts/apache, boot time, setup time |
| Scaleway | pts/stream, pts/hint, pts/compress-7zip, pts/postmark, pts/apache, boot time, setup time |
| IONOS | All 8 profiles including iperf3 |
| STACKIT | All 8 profiles including iperf3 |
| T-Cloud Public | pts/stream, pts/hint, pts/compress-7zip, pts/postmark, pts/apache, boot time, setup time |
| AWS | pts/stream, pts/hint, pts/compress-7zip, pts/postmark, pts/apache, boot time, setup time |

### Known Data Sources (browser access required)

#### OVHcloud + Scaleway — Nexxwave Jan 2024 (Kris Lowet)
- **URL:** https://techblog.nexxwave.eu/benchmark-between-cloud-servers-january-2024/
- **Profiles covered:** pts/apache, pts/hint, pts/compress-7zip, pts/stream, pts/postmark
- **Instance tiers tested:** Shared 2c/4GB, Shared 4c/8GB, Dedicated 4c/16GB
- **Status:** Results are image charts — open in browser and read values from chart axes
- **Contact for raw data:** Kris Lowet via https://nexxwave.eu (ask for .pts result files from Jan 2024 run)

#### OVHcloud — Nexxwave Jan 2023
- **URL:** https://techblog.nexxwave.eu/benchmark-between-hetzner-digitalocean-linode-vultr-ovh-and-upcloud-january-2023/
- **Profiles covered:** pts/apache, pts/hint, pts/compress-7zip, pts/stream, pts/postmark
- **Instance tier:** Shared 2c/4GB (not our selected b3-8 — usable as reference only)
- **Status:** Numeric values extractable — listed in text and tables on page
- **OVHcloud numbers from this study (2c/4GB, reference only):**
  - pts/stream COPY: 30,527 MB/s | SCALE: 14,744 | ADD: 16,868 | TRIAD: 16,988
  - pts/compress-7zip: Compression 7,419 MIPS | Decompression 5,305 MIPS
  - pts/postmark: 2,830 TPS
  - pts/apache: 9,240 req/s
  - pts/hint: 228,757,080 QUIPs

#### IONOS + T-Cloud Public + AWS — benchANT Q3 2021
- **URL:** https://benchant.com/insights/aws-telekom-ionos
- **Profiles covered:** pts/stream, pts/postmark, pts/compress-7zip (confirmed in study description)
- **Status:** JavaScript SPA — must open in browser; does not load in automated tools
- **Contact for raw data:** info@benchant.com (ask for raw PTS scores from Q3 2021 IONOS/OTC/AWS study)

#### STACKIT — Novatec March 2025
- **URL:** https://www.novatec-gmbh.de/en/insights/blog/cloud-benchmarking/
- **Profiles covered:** Phoronix Test Suite (specific profiles not publicly listed)
- **Status:** SSL/TLS error on domain — try in browser; may work
- **Contact for raw data:** via contact form at novatec-gmbh.de (ask for STACKIT PTS scores)

#### AWS m6i.large — OpenBenchmarking.org community result
- **URL:** https://openbenchmarking.org/result/2201298-NE-AWSM6ILAR97
- **Date:** January 2022
- **Status:** Site blocks automated access — try opening directly in browser
- **Note:** This result may be incomplete (described as "did not produce results" in search metadata — verify on page)

### What Must Be Run Directly

Profiles 6 (iperf3), 7 (boot time), and 8 (setup time) have no published data from any provider
or third-party study. These must be measured directly on provisioned instances.

For providers where Phoronix data cannot be sourced (IONOS, STACKIT, T-Cloud Public, and AWS
if the benchANT/OpenBenchmarking data is unusable), running the 5 Phoronix profiles directly
is the only path to comparable data.

### Running the Benchmarks Yourself

```bash
# On each provisioned Ubuntu 22.04 instance:
sudo apt-get install -y phoronix-test-suite

# Run all 5 profiles
phoronix-test-suite run pts/stream pts/hint pts/compress-7zip pts/postmark pts/apache

# Network (iperf3) — run server on instance A, client on instance B (same region)
sudo apt-get install -y iperf3
iperf3 -s &                          # server
iperf3 -c <server-ip> -t 30         # client — repeat 3 times

# Boot time — record at instance-create API call, stop at first successful SSH
# Setup time — record at first SSH, stop when: phoronix-test-suite --version succeeds
```

Estimated cost per provider: €3–10 for 2–4 hours of instance runtime.
Estimated time: ~2 hours per provider (mostly automated after setup).
