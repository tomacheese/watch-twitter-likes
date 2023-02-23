# Development

開発をするには、以下の環境が必要です。

- Windows
- Node.js 16 以上

Crawler（バックエンド API）の開発においては、以下の環境および API キーも必要です。

- Docker 環境
  - Docker for Windows + Docker Compose 環境を推奨
- Discord Bot の Token
- 必要に応じて、Twitter API Consumer Key (App Key) と Twitter API Consumer Secret (App Secret)

エディタとして、Visual Studio Code を推奨します。

## Using language / framework

このプロジェクトでは、以下のプログラミング言語 / フレームワーク・ライブラリを主軸に開発しています。

- `crawler`
  - TypeScript
  - [Fastify](https://www.fastify.io)
  - [discord.js](https://discord.js.org)
  - [Puppeteer](https://pptr.dev/)
- `web`
  - TypeScript
  - [Nuxt.js v3](https://nuxt.com)
- `mock`
  - TypeScript
  - [Fastify](https://www.fastify.io)
  - [Axios](https://axios-http.com/)

## Obligation

それぞれのプロジェクトには、以下の責務を持たせています。

- `crawler`
  - データベースの定義を初期化する
  - `twitter.com` からいいねしたツイート情報を取得し、データベースに登録する
  - 取得したツイート情報を元に Discord に送信する
  - Discord でのボタン押下をトリガーとして対象ツイートをいいねする
  - API エンドポイントの提供（対象情報群・ツイート群・Twitter 連携）
- `web`
  - `likes.amatama.net` でホストされる Web サイトのフロントエンド
- `mock`
  - 開発用のモック API（`likes.amatama.net/api` のラッパ）

## Mechanism

watch-twitter-likes では、いいねしたツイート取得を以下の仕組みで動作しています。

1. データベースからクロール対象の Twitter ユーザ ID とメッセージ送信先の Discord スレッド ID を取得します。
2. Puppeteer を用いて、`twitter.com` から Twitter ユーザ ID に対応するスクリーンネームを取得します。
3. Puppeteer を用いて、`twitter.com` から対象ユーザーがいいねしたツイート一覧を取得します。
4. 新しいツイートをデータベースに登録し、必要に応じて Discord スレッドに送信します。

また、外部に公開するポートを1つにしたいという思想から、`nginx` を用いて API 部分（`/api` 以下）をポートフォワーディングしています。

## Initialize development environment

初めて開発に取り組む場合、以下の手段で開発環境を構築する必要があります。
まず、[Fork](https://github.com/tomacheese/watch-twitter-likes/fork) から自分のアカウントへリポジトリをフォークしてください。  
その後、リポジトリをコンピューターにクローンしてください。

次に、2 つのプロジェクトディレクトリで依存関係パッケージのダウンロード・インストールを行う必要があります。  
プロジェクトのルートディレクトリで `.\scripts\install-deps.ps1` を実行し、依存パッケージのインストールを実施してください。

> **Note**  
> フロントエンドのデザイン調整程度であればデータベースや各種キーの用意をせず、ここまでの作業とモック API サーバを用いて開発可能です。  
> `.\script\mock-dev.ps1` でモック API サーバを起動してください。  
> フロントエンドの開発サーバは `.\scripts\client-dev.ps1` で起動できます。

最後に、データベースの初期化作業と監視対象の登録を行う必要があります。  
プロジェクトのルートディレクトリで `.\scripts\database-dev.ps1` を実行し、データベースサーバを起動してください。  
`mariadbd: ready for connections` と表示されれば、正常に起動しています。

データベースの初期化処理を実施するため、一度クローラーを動作させる必要があります。  
プロジェクトのルートディレクトリで `.\scripts\crawler-dev.ps1` を実行し、`Database initialized` と表示されたことを確認してください。

データベースサーバを起動したら、ブラウザで `localhost:7000` にアクセスし、phpMyAdmin を開きます。  
左側のテーブル一覧から `watch-twitter-likes` を選び、その中の `targets` をクリックしてください。  
ページが遷移したら、ページ上部から「挿入」を選び、データ挿入画面を表示してください。表示された画面に以下のように入力してください。(太字が入力箇所)

| カラム       | タイプ              | 関数 | NULL | 値                                                    |
| :----------- | :------------------ | :--- | :--- | :---------------------------------------------------- |
| `user_id`    | bigint(20) unsigned |      |      | **監視対象の Twitter アカウントのユーザー ID (数字)** |
| `name`       | varchar(255)        |      |      | **任意の名前**                                        |
| `thread_id`  | bigint(20) unsigned |      | ✅   |                                                       |
| `created_at` | timestamp(6)        |      |      | **`current_timestamp()`**                             |

- `監視対象の Twitter アカウントのユーザー ID` にはスクリーンネームではなくアカウント固有の ID (Snowflake とも呼ばれます) を入力してください。
  - 次のサイトが利用できます: [tweeterid.com](https://tweeterid.com/) / [codeofaninja.com](https://www.codeofaninja.com/tools/find-twitter-id/) / [idtwi.com](https://idtwi.com/)
- `任意の名前` には、そのユーザーのニックネームなどをおすすめします。この文字列は Discord に送信される Embed のフッターに挿入されます。
- `created_at` の `current_timestamp()` は、MySQL 環境の場合うまく動作しない場合があります。この場合は入力欄の横にあるカレンダーボタンから任意の日時を選択してください。

入力できたら、右下の `実行` をクリックし監視対象の設定は終了です。即座にクロールしてもらうために、一度クローラーを再起動しましょう。  
既に起動している場合は Ctrl + C などで停止し、もう一度 `.\scripts\crawler-dev.ps1` を実行してください。

### Troubleshooting

一部の環境において、2 回目以降のデータベース接続時に MariaDB がエラーを発生し二度と起動できなくなる症状があるようです。  
この場合、MariaDB と互換性のある MySQL サーバを利用することで回避できるかもしれません。
