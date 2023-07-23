import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm'

/*
2023/02/25 05:17 : imagesテーブルをmediaテーブルに変更する

1. imagesテーブルをmediaテーブルにリネーム
2. type列を追加 (image, video, animated_gif)
3. extension列を追加 (varchar)
4. urlType列を追加 (varchar)
5. row_idのコメントを「画像独自ID」から「メディア独自ID」に変更
6. image_idのコメントを「画像ID」から「メディアID」に変更
   image_id列をmedia_id列にリネーム
7. size列のコメントを「画像サイズ」から「メディアサイズ」に変更
8. width列のコメントを「画像の幅」から「メディアの幅」に変更
9. height列のコメントを「画像の高さ」から「メディアの高さ」に変更
*/
export class MigrationImages2Media1677269790107 implements MigrationInterface {
  public async up(runner: QueryRunner): Promise<void> {
    // imagesテーブルが存在しない場合は何もしない
    if (!(await runner.hasTable('images'))) {
      return
    }

    // 1. imagesテーブルをmediaテーブルにリネーム
    await runner.renameTable('images', 'media')

    // 2. type列を追加 (image, video, animated_gif)
    await runner.addColumn(
      'media',
      new TableColumn({
        name: 'type',
        type: 'enum',
        enum: ['photo', 'video', 'animated_gif'],
        isNullable: false,
        comment: 'メディアの種類',
      })
    )
    // すべてのレコードのtype列をphotoに変更
    await runner.query('UPDATE media SET type = "photo"')

    // 3. extension列を追加 (varchar)
    await runner.addColumn(
      'media',
      new TableColumn({
        name: 'extension',
        type: 'varchar',
        isNullable: false,
        comment: 'メディアの拡張子',
      })
    )
    // すべてのレコードのextension列をjpgに変更
    await runner.query('UPDATE media SET extension = "jpg"')

    // 4. urlType列を追加 (varchar)
    await runner.addColumn(
      'media',
      new TableColumn({
        name: 'url_type',
        type: 'varchar',
        isNullable: false,
        comment: 'メディアのURLタイプ',
      })
    )
    // すべてのレコードのurlType列をmediaに変更
    await runner.query('UPDATE media SET url_type = "media"')

    // 5. row_idのコメントを「画像独自ID」から「メディア独自ID」に変更
    await runner.changeColumn(
      'media',
      'row_id',
      new TableColumn({
        generationStrategy: 'increment',
        name: 'row_id',
        type: 'int',
        comment: 'メディア独自ID',
      })
    )

    // 6. image_idのコメントを「画像ID」から「メディアID」に変更
    //    image_id列をmedia_id列にリネーム
    await runner.changeColumn(
      'media',
      'image_id',
      new TableColumn({
        name: 'media_id',
        type: 'varchar',
        comment: 'メディアID',
      })
    )

    // 7. size列のコメントを「画像サイズ」から「メディアサイズ」に変更
    await runner.changeColumn(
      'media',
      'size',
      new TableColumn({
        name: 'size',
        type: 'enum',
        enum: ['thumb', 'large', 'medium', 'small'],
        comment: 'メディアサイズ',
      })
    )

    // 8. width列のコメントを「画像の幅」から「メディアの幅」に変更
    await runner.changeColumn(
      'media',
      'width',
      new TableColumn({
        name: 'width',
        type: 'int',
        comment: 'メディアの幅',
      })
    )

    // 9. height列のコメントを「画像の高さ」から「メディアの高さ」に変更
    await runner.changeColumn(
      'media',
      'height',
      new TableColumn({
        name: 'height',
        type: 'int',
        comment: 'メディアの高さ',
      })
    )
  }

  public async down(): Promise<void> {
    // めんどくさい
    throw new Error('This migration cannot be reverted.')
  }
}
