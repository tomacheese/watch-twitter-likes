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

## Mechanism

watch-twitter-likes では、いいねしたツイート取得を以下の仕組みで動作しています。

1. データベースからクロール対象の Twitter ユーザ ID とメッセージ送信先の Discord スレッド ID を取得します。
2. Puppeteer を用いて、`twitter.com` から Twitter ユーザ ID に対応するスクリーンネームを取得します。
3. Puppeteer を用いて、`twitter.com` から対象ユーザがいいねしたツイート一覧を取得します。
4. 新しいツイートをデータベースに登録し、必要に応じて Discord スレッドに送信します。

また、外部に公開するポートを1つにしたいという思想から、`nginx` を用いて API 部分（`/api` 以下）をポートフォワーディングしています。

## Initialize development environment

初めて開発に取り組む場合、以下の手段で開発環境を構築する必要があります。
まず、[Fork](https://github.com/tomacheese/watch-twitter-likes/fork) から自分のアカウントへリポジトリをフォークしてください。  
その後、リポジトリをコンピューターにクローンしてください。

以降の作業は、どのプロジェクトで開発するかによって異なります。

### `crawler` の開発をする場合

この場合、以下の依存関係と初期設定を必要とします。

- MySQL
- `crawler/package.json` に記載された依存パッケージ群
- `data/config.json` への設定情報の入力

### `web` の開発をする場合

次に、2 つのプロジェクトディレクトリで依存関係パッケージのダウンロード・インストールを行う必要があります。  
プロジェクトのルートディレクトリで `.\scripts\install-deps.ps1` を実行し、依存パッケージのインストールを実施してください。

> **Note**  
> フロントエンドのデザイン調整程度であればデータベースや各種キーの用意をせず、ここまでの作業で開発可能です。  
> `.\scripts\client-only-dev.ps1` で起動できます。

最後に、データベースの初期化作業と監視対象の登録を行う必要があります。  
プロジェクトのルートディレクトリで `.\scripts\database-dev.ps1` を実行し、データベースサーバを起動してください。  
`MySQL init process done. Ready for start up.` と表示されれば、正常に起動しています。

データベースの初期化処理を実施するため、一度クローラーを動作させる必要があります。  
プロジェクトのルートディレクトリで `.\scripts\crawler-dev.ps1` を実行し、`Database initialized` と表示されたことを確認してください。

データベースサーバを起動したら、ブラウザで `localhost:7000` にアクセスし、phpMyAdmin を開きます。  
左側のテーブル一覧から `watch-twitter-likes` を選び、その中の `targets` をクリックしてください。  
ページが遷移したら、ページ上部から「挿入」を選び、データ挿入画面を表示してください。表示された画面に以下のように入力してください。(太字が入力箇所)

| カラム       | タイプ              | 関数 | NULL | 値                                                    |
| :----------- | :------------------ | :--- | :--- | :---------------------------------------------------- |
| `user_id`    | bigint(20) unsigned |      |      | **監視対象の Twitter アカウントのユーザ ID (数字)** |
| `name`       | varchar(255)        |      |      | **任意の名前**                                        |
| `thread_id`  | bigint(20) unsigned |      | ✅    |                                                       |
| `created_at` | timestamp(6)        |      |      | **`current_timestamp()`**                             |

- `監視対象の Twitter アカウントのユーザ ID` にはスクリーンネームではなくアカウント固有の ID (Snowflake とも呼ばれます) を入力してください。
  - 次のサイトが利用できます: [tweeterid.com](https://tweeterid.com/) / [codeofaninja.com](https://www.codeofaninja.com/tools/find-twitter-id/) / [idtwi.com](https://idtwi.com/)
- `任意の名前` には、そのユーザのニックネームなどをおすすめします。この文字列は Discord に送信される Embed のフッターに挿入されます。
- `created_at` の `current_timestamp()` は、MySQL 環境の場合うまく動作しない場合があります。この場合は入力欄の横にあるカレンダーボタンから任意の日時を選択してください。

入力できたら、右下の `実行` をクリックし監視対象の設定は終了です。即座にクロールしてもらうために、一度クローラーを再起動しましょう。  
既に起動している場合は Ctrl + C などで停止し、もう一度 `.\scripts\crawler-dev.ps1` を実行してください。

## Configuration

`data/config.json` の設定項目は以下の通りです。記載がない場合、項目は必須項目です。

- `discord`: Discord に関する設定
  - `token`: Discord Bot のトークン
- `twitter`: Twitter アカウントに関する設定
  - `username`: ログインユーザ名
  - `password`: ログインパスワード
  - `authCodeSecret`: ワンタイムパスワードのシークレット（任意）
  - `discordUserId`: Discord 経由でのツイートのいいねをする場合に、その操作を許可する Discord ユーザ ID
- `twAuth`: Web サイトにて、Twitter アカウントログインするための API 情報（任意）
  - `appKey`: Twitter API Consumer Key (App Key)
  - `appSecret`: Twitter API Consumer Secret (App Secret)
  - `callbackUrl`: Twitter API のアプリ画面で登録したコールバック URL
- `db`: データベースに関する設定
  - `type`: データベースの種別。`mysql` で固定
  - `host`: ホスト名。Docker で動作させる場合はサービス名である `mysql` で固定
  - `port`: ポート番号。Docker で動作させる場合は `3306` で固定
  - `username`: ユーザ名
  - `password`: パスワード
  - `database`: データベース名
- `session`: Web サイトにおける、セッション管理の設定（任意）
  - `secret`: セッションのシークレット。ランダムな文字列を指定
  - `isSecure`: HTTPS 接続のみで動作するセッションとするか（任意）

`twitter` で設定するアカウントは「いいねされたツイートの収集」と「Discord 経由でのツイートのいいね」に利用されます。
`twAuth` を設定しない場合、Web サイトにおける Twitter ログイン機能は利用できません。  
`session` を指定しない場合、Web サイトにおける Twitter ログインが保持されなくなります。

JSON Schemaとして、`crawler/schema/Configuration.json` が利用できます。`config.json` 内で以下のように定義してください。  

```json
{
  "$schema": "../crawler/schema/Configuration.json"
}
```
