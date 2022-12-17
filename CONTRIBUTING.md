# Development

開発を行うには、以下の環境が必要です。

- Windows
- Docker for Windows
- Docker Compose（`docker-compose` コマンドが実行できること）
- Node.js 18

さらに、以下サービスの API キーが必要です。

- Twitter API Consumer Key (App Key)
- Twitter API Consumer Secret (App Secret)
- Discord Bot Token

Twitter API については、v2 のアプリケーションしか持っていない場合 Elevated access を取得している必要があります。  
v1 のキーを所持している場合は Elevated access を得ていなくても利用可能です。

## Using language / framework

このプロジェクトでは、以下のプログラミング言語 / フレームワーク・ライブラリを主軸に開発しています。

- `crawler`
  - TypeScript
  - [Nuxt.js v3](https://nuxt.com)
- web
  - TypeScript
  - [Fastify](https://www.fastify.io)
  - [discord.js](https://discord.js.org)

## Built environment

初めて開発に取り組む場合、以下の手段で開発環境を構築する必要があります。

まず、[Fork](https://github.com/tomacheese/watch-twitter-likes/fork) から自分のアカウントへリポジトリをフォークしてください。  
その後、リポジトリをコンピューターにクローンしてください。

次に、2つのプロジェクトディレクトリで依存関係パッケージのダウンロード・インストールを行う必要があります。  
プロジェクトのルートディレクトリで `.\scripts\install-deps.ps1` を実行し、依存パッケージのインストールを実施してください。

最後に、データベースの初期化作業と監視対象の登録を行う必要があります。  
プロジェクトのルートディレクトリで `.\scripts\database-dev.ps1` を実行し、データベースサーバを起動してください。  
`mariadbd: ready for connections` と表示されれば、正常に起動しています。

データベースの初期化処理を実施するため、一度 Crawler を動作させる必要があります。  
プロジェクトのルートディレクトリで `.\scripts\client-dev.ps1` を実行し、`Database initialized` と表示されたことを確認してください。

データベースサーバを起動したら、ブラウザで `localhost:7000` にアクセスし、phpMyAdmin を開きます。  
左側のテーブル一覧から `watch-twitter-likes` を選び、その中の `targets` をクリックしてください。  
ページが遷移したら、ページ上部から「挿入」を選び、データ挿入画面を表示してください。表示された画面に以下のように入力してください。(太字が入力箇所)

| カラム | タイプ | 関数 | NULL | 値 |
| :-- | :-- | :-- | :-- | :-- |
| `user_id` | bigint(20) unsigned | | | **監視対象の Twitter アカウントのユーザー ID (数字)** |
| `name` | varchar(255) | | | **任意の名前** |
| `thread_id` | bigint(20) unsigned | | ✅ | |
| `created_at` | timestamp(6) | | | **`current_timestamp()`** |

- `監視対象の Twitter アカウントのユーザー ID` にはスクリーンネームではなくアカウント固有の ID (Snowflake とも呼ばれます) を入力してください。
  - 次のサイトが利用できます: [tweeterid.com](https://tweeterid.com/) / [codeofaninja.com](https://www.codeofaninja.com/tools/find-twitter-id/) / [idtwi.com](https://idtwi.com/)
- `任意の名前` には、そのユーザーのニックネームなどをおすすめします。この文字列は Discord に送信される Embed のフッターに挿入されます。
- `created_at` の `current_timestamp()` は、MySQL 環境の場合うまく動作しない場合があります。この場合は入力欄の横にあるカレンダーボタンから任意の日時を選択してください。

入力できたら、右下の `実行` をクリックし監視対象の設定は終了です。即座にクロールしてもらうために、一度クローラーを再起動しましょう。  
既に起動している場合は Ctrl + C などで停止し、もう一度 `.\scripts\client-dev.ps1` を実行してください。

---

以降、開発を行う際はプロジェクトルートにある `watch-twitter-likes.code-workspace` からワークスペースを開くことで開発を行えます。  
Visual Studio Code でワークスペースを開くと、自動的に以下の3つが動作します。ただし、初めて開発に取り組む場合は **Built environment の作業を先に** 行ってください。

- `.\scripts\client-dev.ps1`: フロントエンドの開発サーバを起動
- `.\scripts\crawler-dev.ps1`: バックエンド(クローラー)の開発サーバを起動
- `.\scripts\database-dev.ps1`: データベースサーバを起動

### Troubleshooting

一部の環境において、2回目以降のデータベース接続時に MariaDB がエラーを発生し二度と起動できなくなる症状があるようです。  
この場合、MariaDB と互換性のある MySQL サーバを利用することで回避できるかもしれません。具体的には、以下の手段で対応できます。

`docker-compose.only-db.yml` を開き、以下の箇所を変更してください。サービス名等は変更しないでください。

```diff
--- docker-compose.only-db.yml
+++ docker-compose.only-db.yml
@@ -2,10 +2,10 @@

 services:
   mariadb:
-    image: mariadb
+    image: mysql
     restart: always
     environment:
-      MARIADB_ROOT_PASSWORD: rootPassword
+      MYSQL_ROOT_PASSWORD: rootPassword
       MYSQL_USER: watcher
       MYSQL_PASSWORD: password
       MYSQL_DATABASE: watch-twitter-likes
```

その後、`.\scripts\database-dev.ps1` などで起動することで動作します。  
この変更を行った場合、`docker-compose.only-db.yml` をコミットしないよう注意してください。

## Directory structure

このプロジェクトのディレクトリ構成は以下の通りです。

- `.github`: ワークフローファイルなど、GitHub 用のファイルが置いてあります
- `.vscode`: タスク設定ファイルなど、Visual Studio Code 用のファイルが置いてあります
- **`crawler`**: クローラーシステムのプロジェクトディレクトリです
- `data`: 設定ファイルなどが置いてあるデータディレクトリです
- `db-data`: データベースファイルが置いてあるデータベース用ディレクトリです
- `scripts`: 開発用のスクリプト置き場です
- **`web`**: Web サイトシステムのプロジェクトディレクトリです
