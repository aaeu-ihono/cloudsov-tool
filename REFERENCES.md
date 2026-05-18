# External References

## Thesis Documents

- [Thesis Scope](attachments/[THESIS]%20-%20Scope%203.docx) — high-level 3-phase research scope (local copy; source: Google Docs)
  - Google Docs: https://docs.google.com/document/d/1SPuD1PPw1Pa0uuMmHIYUon9srxTA5xlTnyy_IaLT2-A/edit?usp=sharing

- [Alps Alpine Cloud Infrastructure Checklist](attachments/[THESIS]%20Alps%20Alpine%20Cloud%20Infrastructure%20Checklist.pdf) — company checklist of 95 services across 12 categories; 58 marked as needed (Ja); this is the rubric for the Cloud Readiness Assessment

## AWS Reference

- AWS Products (265 total): https://aws.amazon.com/de/products/?nc2=h_prod&refid=0fab48b0-962e-4ec1-ab3e-0469275f93fb

## Cloud Readiness Assessment — Full AWS Service List (60 products)

Derived from two sources:
- **Alps Alpine checklist** (Ja = needed by the company) — 50 products
- **Industry Top 50 most used AWS services** (cross-source consensus 2023–2025) — adds 10 more

All 60 are included in the assessment. Products marked ⭐ are needed by Alps Alpine per the checklist. Products marked 🌐 are industry-standard top-50 services added for completeness of the assessment rubric.

### 1. Application
| # | AWS Product | Checklist | Covers |
|---|-------------|-----------|--------|
| 1 | AWS Amplify | ⭐ | Web application, Admin Dashboard hosting |

### 2. Compute
| # | AWS Product | Checklist | Covers |
|---|-------------|-----------|--------|
| 2 | AWS Lambda | ⭐ | Function-as-a-Service |
| 3 | Amazon ECS | ⭐ | Container Hosting (Docker) |
| 4 | Amazon EKS | ⭐ | Container Hosting (Kubernetes) |
| 5 | Amazon EC2 | ⭐ | Linux VMs, API backend runtime |
| 6 | AWS Batch | ⭐ | Batch Processing |
| 7 | AWS Elastic Beanstalk | 🌐 | Managed PaaS app deployment |

### 3. Storage
| # | AWS Product | Checklist | Covers |
|---|-------------|-----------|--------|
| 8 | Amazon S3 | ⭐ | Object Storage |
| 9 | Amazon S3 Glacier | ⭐ | Archival Storage |
| 10 | Amazon EBS | ⭐ | SSD & HDD Block Storage |
| 11 | AWS Backup | ⭐ | Backup Storage |
| 12 | Amazon EFS | 🌐 | Network File System / shared file storage |

### 4. Database
| # | AWS Product | Checklist | Covers |
|---|-------------|-----------|--------|
| 13 | Amazon RDS | ⭐ | PostgreSQL (managed relational DB) |
| 14 | Amazon DocumentDB | ⭐ | Document Database (MongoDB-compatible) |
| 15 | Amazon DynamoDB | ⭐ | Key-Value Store |
| 16 | Amazon Timestream | ⭐ | Time-Series Database (IoT data) |
| 17 | Amazon Aurora | 🌐 | High-performance MySQL/PostgreSQL-compatible DB |
| 18 | Amazon ElastiCache | 🌐 | In-memory caching (Redis / Memcached) |
| 19 | Amazon Redshift | 🌐 | Data Warehouse / analytics at scale |

### 5. Networking
| # | AWS Product | Checklist | Covers |
|---|-------------|-----------|--------|
| 20 | AWS Application Load Balancer | ⭐ | ALB — HTTP/HTTPS traffic |
| 21 | AWS Network Load Balancer | ⭐ | NLB — TCP/UDP traffic |
| 22 | Amazon VPC | ⭐ | Virtual Private Network / network isolation |
| 23 | Amazon Route 53 | ⭐ | DNS Management |
| 24 | Amazon API Gateway | ⭐ | API Gateway, REST/WebSocket |
| 25 | Amazon CloudFront | 🌐 | Content Delivery Network (CDN) |
| 26 | AWS Direct Connect | 🌐 | Dedicated hybrid / on-premise connectivity |

### 6. AI / ML
| # | AWS Product | Checklist | Covers |
|---|-------------|-----------|--------|
| 27 | Amazon Rekognition | ⭐ | Image Recognition |
| 28 | Amazon SageMaker | ⭐ | Model Training, Deployment/Inference |
| 29 | Amazon Bedrock | ⭐ | Large Language Models (GPT-like) |
| 30 | AWS Glue | ⭐ | Data Pipeline / ETL |
| 31 | Amazon EMR | ⭐ | Big Data Analytics (Spark/Hadoop) |
| 32 | Amazon Athena | ⭐ | Big Data Analytics (serverless SQL) |

### 7. Security & Identity
| # | AWS Product | Checklist | Covers |
|---|-------------|-----------|--------|
| 33 | AWS IAM | ⭐ | Identity & Access Management |
| 34 | Amazon Cognito | ⭐ | User Authentication |
| 35 | AWS IAM Identity Center | ⭐ | Single Sign-On (SSO) |
| 36 | AWS KMS | ⭐ | Encryption Key Management |
| 37 | AWS Secrets Manager | ⭐ | Secrets Management |
| 38 | AWS Certificate Manager | ⭐ | Certificate Management (SSL/TLS) |
| 39 | Amazon GuardDuty | ⭐ | Security Monitoring / Threat Detection |
| 40 | AWS Security Hub | ⭐ | Compliance Monitoring |
| 41 | AWS Config | ⭐ | Compliance Monitoring (config rules) |
| 42 | AWS Shield | ⭐ | DDoS Protection |
| 43 | AWS WAF | ⭐ | Web Application Firewall |
| 44 | AWS CloudTrail | 🌐 | API audit logging — GDPR forensics & compliance |

### 8. Monitoring & Operations
| # | AWS Product | Checklist | Covers |
|---|-------------|-----------|--------|
| 45 | Amazon CloudWatch | ⭐ | App Monitoring, Logs, Alerting, Performance |
| 46 | Amazon SNS | ⭐ | Notification Service, Pub/Sub Messaging |
| 47 | AWS Systems Manager | ⭐ | Incident Management |
| 48 | AWS Cost Explorer | ⭐ | Cost & Budget Monitoring |

### 9. Development & Deployment
| # | AWS Product | Checklist | Covers |
|---|-------------|-----------|--------|
| 49 | AWS CodeBuild | ⭐ | Build Automation |
| 50 | AWS CodeDeploy | ⭐ | Deployment Automation |
| 51 | AWS CodePipeline | ⭐ | Pipeline Orchestration |
| 52 | Amazon ECR | ⭐ | Container Registry |
| 53 | AWS CloudFormation | 🌐 | Infrastructure-as-Code |

### 10. IoT
| # | AWS Product | Checklist | Covers |
|---|-------------|-----------|--------|
| 54 | AWS IoT Core | ⭐ | Device Communication (MQTT) |
| 55 | AWS IoT Device Management | ⭐ | IoT Device Management |

### 11. Messaging & Integration
| # | AWS Product | Checklist | Covers |
|---|-------------|-----------|--------|
| 56 | Amazon SQS | ⭐ | Message Queue |
| 57 | Amazon EventBridge | ⭐ | Event Bus |
| 58 | AWS Step Functions | ⭐ | Workflow Orchestration |
| 59 | Amazon SES | ⭐ | Email Service |
| 60 | Amazon Kinesis | 🌐 | Real-time data streaming |

### Legend
- ⭐ = Needed by Alps Alpine (marked Ja in checklist) — **50 products**
- 🌐 = Industry Top 50 standard service, not currently identified as needed — **10 products**

