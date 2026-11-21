# Quit ZYN — ニコチンポーチ断ちアプリ

Quittr 風ホーム画面の UI をそのままに、中身を**ニコチンポーチ（ZYN）断ち**
仕様にしたアプリです。レイアウト・色・サイズは元のデザイン
（`quittr-home.html`、GitHub Copilot デザイン）の CSS 値をそのまま
`src/theme.ts` と各コンポーネントに写しています。差し替えたのは文言だけです：

- レベル名：First Step → 72 Hours → One Week → One Month → Two Months → **Nicotine-Free**
- メトリクス：SLIPS / STREAK / **TIL NIC-FREE**
- Progress のピル：**ZYN-Free by （開始日＋90日）**
- 効果カード：Healthier Gums & Breath / Sharper Focus / Money Back in Your Pocket
- Panic Button のモーダル：渇望は 3〜5 分で山を越える前提の文言に変更

※ ストア公開時はアプリ名の「ZYN」が商標に触れる可能性があります。
　公開する場合は `Quit Pouches` 等への改名を検討してください（`app.json` の `name` 1箇所）。

## テーパリング機能（v1.1 で追加）

一気断ち（現行のストリーク）とは別に、**週ごとに上限を下げてゼロまで
段階的に減らす**テーパリングプランを選べます。仕様書は
`quit-zyn-tapering-spec-v1.md`（納品物に同梱）。

- **方式**：個数ラダー → 強度ラダー → ゼロ。個数と mg は同時に下げない。
  例（Standard・12個×6mg）：個数 12→10→8→6→5→4→3→2（週ごと）、
  次に強度 6mg+3mg 混在週 → 3mg×2 の週、計10週で Zero Day
- **上限は天井**：超えた日は `over` として記録するだけで、Slip には
  ならない（`relapses` は加算しない）
- **入口**：Profile → My Plan → Start a taper（ウィザード4画面）。
  平均が分からない場合は「3日間計測モード」からプランを作れる
- **記録**：ホームの **+ Log pouch**（タップ +1 / 長押しで取り消し）
- **調整**：Profile から Hold（同じ上限をもう1週）/ Step back /
  Pause（再開時に日数ぶん後ろ倒し）/ End が可能
- **引き継ぎ**：Zero Day の朝、既存のストリーク（`startAt` = Zero Day、
  90日ゴール）に自動で切り替わる
- **保存**：新規キー `quittr:taper:v1` のみ追加。既存の
  `quittr:streak:v1` は無改変で併存。新規依存はゼロ（通知は Phase 2）
- **計算の検証**：`scripts/verify-taper.ts`（ラダー生成・mg計算・
  Zero Day・節約額の表駆動チェック）

## Learn タブ（v1.2 で追加）

旧 Support タブを **Learn** に作り替えた（ルートは `/support` のまま、
タブバーの表示名だけ Learn）。Quittr の Learn 画面の UI を踏襲：

- 上部にカテゴリタイル（Meditate / Sleep / Articles / Guides、グラデーション）
- **Start here**：おすすめ順の学習パス5本（縦のレール＋ドット付きリスト）
- 記事は全9本をアプリ内に収録（`src/data/articles.ts`、外部通信なし）：
  脳の仕組み／渇望の乗り切り方／隠れた危険サイン／禁断症状タイムライン／
  テーパリング解説／睡眠／歯ぐき／口寂しさの代替／脳の霧
- 記事はそのまま読めるリーダー画面（グラデーションヒーロー＋本文）。
  テーパリング解説の末尾にはプラン作成への導線あり
- 文言はすべて自作の一般情報で、医療助言ではない旨を末尾に明記

### 仕様からの変更点（v1.1 としての確定事項）

- 個数ラダーは削減率 Standard 20% の四捨五入で生成（仕様書§3.3の
  例示表とは一部週が異なる。飛ばし週を作らないため）
- 強度ラダーは「混在週 → 全量週」を 3mg まで（3mg 開始の人は
  1.5mg まで）とし、そこからゼロへ。総期間はウィザードで実計算表示

## スタック（指定どおり）

| 項目 | 値 |
|---|---|
| Expo SDK | 58 (`expo ~58.0.0`) |
| React Native | 0.88.1 |
| React | 19.3.0 |
| TypeScript | strict（`strict: true` + `noUncheckedIndexedAccess` 等を追加で有効化） |
| ルーティング | Expo Router（`app/` ファイルルーティング、タブは自作バーで再現） |
| 永続化 | **AsyncStorage のみ**（SQLite / SecureStore / MMKV は不使用） |
| テーマ | ダーク専用（`userInterfaceStyle: "dark"`、ライト値は一切なし） |
| Node | 22（`.nvmrc` / `.node-version` / `engines` / CI すべて 22、要 22.13+） |

## 画面の対応表（HTML → RN）

| HTML | RN |
|---|---|
| `.topbar` ワードマーク + 金グラデの `90` バッジ | `app/(tabs)/index.tsx`（`expo-linear-gradient`） |
| `.orb` 中央オーブ（放射グラデ重ね） | `src/components/Orb.tsx`（`react-native-svg` の RadialGradient で再現） |
| `.side-orb` + 1つ前のレベル名 / 日数 | `src/components/SideOrb.tsx`（1つ前のレベルのオーブ） |
| `.hero-caption` 現在レベル名 / 日数 | 現在レベルの表示。レベル表は `src/theme.ts` の `LEVELS` |
| `.metrics` SLIPS / STREAK / TIL NIC-FREE | `src/components/MetricCard.tsx`（中央だけ金枠グラデ） |
| `.actions` Pledged / Melius / Meditate / Reset | 丸アイコン 59px。Pledged は当日トグル、Reset は確認後に再スタート＋slip+1 |
| `.rewiring` Brain Rewiring 100% | ストリーク経過 ÷ 90日 で自動計算 |
| `.panic` Panic Button | 赤グラデ。押すと呼吸法モーダル（`PanicModal`） |
| `.tabbar` 5タブ | `src/components/AppTabBar.tsx`（ネイティブタブバーだと見た目が一致しないため自作） |

初回起動時はデザイン画と一致させるため、ストリークを **90日 1時間 1分 /
slips 2** でシードします（`src/store/streak.ts` の `seedState`）。
Reset すると今日から 0 日に戻ります。データは AsyncStorage の
`quittr:streak:v1` 1キーだけに保存します。

## ローカルで動かす

```bash
nvm use          # Node 22
npm install
npx expo start   # Expo Go / 開発ビルドで確認
npm run typecheck
```

`app.json` の `extra.eas.projectId` は仮置きです。自分のプロジェクトで
`npx eas init` を1回実行して差し替えてください（ビルド前に必須）。

## ビルド：GitHub Actions で `eas build --local`

ワークフロー全文は [`.github/workflows/build.yml`](.github/workflows/build.yml)。

### なぜ EAS の枠を使わないのか

通常の `eas build` は EAS Cloud のキューでビルドされ、**EAS のビルド枠
（無料プランの優先ビルド分数）を消費**します。
`eas build --local` は同じ EAS のビルド手順を **GitHub Actions のランナー上
で実行**する方式で、EAS には認証情報の取得でしかアクセスしないため、
**EAS 枠は消費されません**。代わりに消費するのは GitHub Actions の分数だけです。

### Secrets は `EXPO_TOKEN` のみ

1. expo.dev → Account settings → Access tokens でトークンを発行
2. GitHub リポジトリ → Settings → Secrets and variables → Actions →
   New repository secret に `EXPO_TOKEN` として登録

Apple / Google のパスワードは GitHub に置きません。キーストアや
プロビジョニングは EAS credentials 側にあり、トークン経由で取得されます。

### 実行方法

Actions タブ → **Build (EAS local)** → Run workflow →
platform（all / android / ios）と profile（production / preview / development）を選択。
成果物（.aab / .apk / .ipa）は Artifacts からダウンロード（保持 14 日）。

手動トリガーだけにしているのは、push のたびに分数を燃やさないためです。

### 月 6〜7 回の目安（概算）

| ビルド | 実時間の目安 | 課金分数の目安（private repo） |
|---|---|---|
| Android（ubuntu） | 15〜25 分 | そのまま 15〜25 分 |
| iOS（macos） | 25〜40 分 | **10倍**換算で 250〜400 分 |

「月 6〜7 回」を all（Android+iOS 同時）で回すと iOS の 10 倍換算だけで
月 1,500〜2,800 分規模になります。現実的な配分は
**普段は Android のみ × 4 回 + リリース時だけ all × 2〜3 回**。
public repo なら Actions 分数は無料なので、この心配はほぼ消えます。
※ 時間は初回（キャッシュなし）は長め、2 回目以降は npm キャッシュで短縮されます。

ローカルで同じことをやる場合：

```bash
npm run build:android:local   # eas build --local --platform android
npm run build:ios:local       # ※ iOS の --local は Mac が必須
```
