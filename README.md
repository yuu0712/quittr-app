# LastPouch への改名差分

## 最優先（名前の確保）
App Store Connect で新規Appを作成し、名前を **LastPouch** で登録する。
アプリレコードを作った時点で名前が確保されるので、これを先にやること。

## ファイルの上書き
このフォルダの中身を、PC の `C:\Users\burok\Downloads\quittr-app` に
フォルダ構成のまま上書きコピーする。

- app.json（名前のみ変更。bundle ID `com.quitpouches.app` と projectId は据え置き）
- app/(tabs)/index.tsx（ホームのワードマーク → LastPouch）
- docs/privacy-policy.html / docs/support.html（アプリ名の差し替え）

Progress のピル「Pouch-Free by …」は名前と無関係なので変更なし。

## その後
```
git add .
git commit -m "LastPouchに改名"
git push
```
→ Actions の Build (EAS local) で platform: ios を再ビルド
→ 新しい IPA で `npx eas submit --platform ios --path <ipa>`
（取得済みの旧IPAは表示名が Quit Pouches のため提出に使わない）

掲載文は同梱の store-listing-lastpouch.md を使用。
スクリーンショットは改名後の状態で撮り直したものを別途使うこと。
