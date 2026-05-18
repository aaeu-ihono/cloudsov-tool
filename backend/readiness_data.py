"""
readiness_data.py
Defines the 60 AWS services across 11 categories used as the
Cloud Readiness Assessment rubric.
"""

READINESS_CATEGORIES: dict[str, list[str]] = {
    "Application": [
        "AWS Amplify",
    ],
    "Compute": [
        "AWS Lambda",
        "Amazon ECS",
        "Amazon EKS",
        "Amazon EC2",
        "AWS Batch",
        "AWS Elastic Beanstalk",
    ],
    "Storage": [
        "Amazon S3",
        "Amazon S3 Glacier",
        "Amazon EBS",
        "AWS Backup",
        "Amazon EFS",
    ],
    "Database": [
        "Amazon RDS",
        "Amazon DocumentDB",
        "Amazon DynamoDB",
        "Amazon Timestream",
        "Amazon Aurora",
        "Amazon ElastiCache",
        "Amazon Redshift",
    ],
    "Networking": [
        "AWS Application Load Balancer",
        "AWS Network Load Balancer",
        "Amazon VPC",
        "Amazon Route 53",
        "Amazon API Gateway",
        "Amazon CloudFront",
        "AWS Direct Connect",
    ],
    "AI/ML": [
        "Amazon Rekognition",
        "Amazon SageMaker",
        "Amazon Bedrock",
        "AWS Glue",
        "Amazon EMR",
        "Amazon Athena",
    ],
    "Security": [
        "AWS IAM",
        "Amazon Cognito",
        "AWS IAM Identity Center",
        "AWS KMS",
        "AWS Secrets Manager",
        "AWS Certificate Manager",
        "Amazon GuardDuty",
        "AWS Security Hub",
        "AWS Config",
        "AWS Shield",
        "AWS WAF",
        "AWS CloudTrail",
    ],
    "Monitoring": [
        "Amazon CloudWatch",
        "Amazon SNS",
        "AWS Systems Manager",
        "AWS Cost Explorer",
    ],
    "Dev/Deploy": [
        "AWS CodeBuild",
        "AWS CodeDeploy",
        "AWS CodePipeline",
        "Amazon ECR",
        "AWS CloudFormation",
    ],
    "IoT": [
        "AWS IoT Core",
        "AWS IoT Device Management",
    ],
    "Messaging": [
        "Amazon SQS",
        "Amazon EventBridge",
        "AWS Step Functions",
        "Amazon SES",
        "Amazon Kinesis",
    ],
}

# Chart X-axis order: Scalability + Performance first, then feature categories
CHART_DIMENSIONS: list[str] = ["Scalability", "Performance"] + list(READINESS_CATEGORIES.keys())

# Coverage value → points (same scale as SovScore for consistency)
COVERAGE_POINTS: dict[str, int] = {"Y": 2, "P": 1, "N": 0}
