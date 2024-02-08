import { Duration, Stack, StackProps } from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
//SQS キューと SNS トピックを作成し、その間にサブスクリプションを設定
export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // Amazon SQS キューを作成
    const queue = new sqs.Queue(this, "CdkQueue", {
      visibilityTimeout: Duration.seconds(300), // メッセージの可視性タイムアウトを300秒に設定
    });
    // Amazon SNS トピックを作成
    const topic = new sns.Topic(this, "CdkTopic");
    // SQS キューを SNS トピックにサブスクライブ
    topic.addSubscription(new subs.SqsSubscription(queue));
  }
}
