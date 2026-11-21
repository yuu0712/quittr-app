# Quit ZYN テーパリング機能 仕様書 v1.0（v1.1 実装済み）

> **実装完了（2026-11-16）**: ユウが推奨案3点を承認し、本仕様で実装・納品した。
> 実装時の確定変更は2点のみ: ①個数ラダーは削減率の四捨五入生成とし、§3.3の例示表とは一部週が異なる（例: Standard 12個は 12→10→8→6→5→4→3→2、飛ばし週なし）。②強度ラダーは混在週→全量週を3mgまで（3mg開始は1.5mgまで）とし、総期間はウィザードで実計算表示する。検証: 計算の表駆動チェック全通過、`tsc` 通過、expo-doctor 20/20、Web export 全ルート成功。

対象アプリ: `quittr-app`（Expo SDK 58 / RN 0.88.1 / React 19.3 / TS strict / Expo Router / AsyncStorageのみ / ダーク専用）
既存前提: ストリークは `quittr:streak:v1` の単一キー `{ startAt, relapses, pledgedOn }`、`useStreak` フック、90日ゴール（`SOBER_GOAL_DAYS = 90`）、レベル First Step → Nicotine-Free。
本仕様の位置づけ: **医療助言ではなく行動サポート**。効果を保証する文言は入れない（§11）。

---

## 0. 決定サマリー（ここだけ読めば方針が分かる）

| 論点 | 決定 |
|---|---|
| 方式 | **個数ラダー → 強度ラダー → ゼロ** の2段階。個数とmgは同時に下げない |
| 上限の意味 | 1日の上限は「目標」ではなく **天井（ceiling）**。下回るのは良いこと |
| 超過の扱い | 上限超過は **Slip（ストリークのリセット）にしない**。`over` として記録するだけ |
| ペース | Gentle / Standard / Fast の3プリセット。デフォルトは Standard |
| ベースライン | 「平均を知っている」は即プラン生成、「知らない」は3日間計測モード（任意） |
| 保存 | 新規キー `quittr:taper:v1` を追加。既存 `quittr:streak:v1` は無改変で併存 |
| ゼロ到達後 | その日を `startAt` として既存のストリーク／Progress画面に自動で引き継ぐ |
| 通知 | MVPでは入れない（`expo-notifications` 未導入のため）。Phase 2 で追加 |
| 入口 | 初回起動時のモード選択 ＋ Profile の「My Plan」からいつでも開始／変更可 |

根拠: 個数と強度は「一度に1つのレバーだけ動かし、各段を保持してから次へ」が定石とされ、強度ラダーは 6mg → 3mg → 1.5mg が実在製品の段。一気断ちが現実的なのは1日1〜3個までで、4〜8個は2〜3週、9〜15個は4〜6週、15個超は6〜10週のテーパーが目安（出典は §13）。

---

## 1. スコープ

### MVP（v1に入れる）
1. モード選択（Cold Turkey = 現行 / Taper）
2. プラン生成ウィザード（4画面、§4）
3. 週次ラダー表の自動生成（§3の計算式、純粋関数）
4. 1タップ記録（+1 / 長押しで取り消し、mgはその週の規定値）
5. ホーム画面のテーパー表示（§6.2）、Progress画面のラダー表示（§6.3）
6. 週次判定：前進 / ホールド（同じ上限をもう1週）/ ステップバック（§7）
7. ゼロデイ到達 → ストリークへの引き継ぎ（§7.4）
8. プランの一時停止・再計算・破棄

### MVPに入れない（Phase 2）
- プッシュ通知（段階が下がる前夜、朝の上限提示、夜のチェックイン）
- トリガー記録（食後／運転／コーヒー等）と Panic モーダル連動
- ニコチンフリー・ポーチ（0mg）への置換サジェスト
- グラフの月次ビュー、CSVエクスポート、共有画像生成

---

## 2. 用語とモード

- **Baseline**: 開始時点の「1日あたり個数 × mg」。例: 12個 × 6mg = 72mg/日
- **Limit**: その週の1日上限（個数）。天井でありノルマではない
- **Step**: ラダーの1段。原則1週間単位
- **Hold**: 同じ Limit で週を繰り返すこと（失敗ではない）
- **Over**: Limit を超えた日。Slip とは別カウント
- **Zero Day**: 予定された完全終了日。この日からストリーク開始

モードは排他: `mode: 'cold-turkey' | 'baseline' | 'tapering' | 'nicotine-free'`
`nicotine-free` は現行ストリーク画面がそのまま担う。

---

## 3. プラン生成アルゴリズム（最重要・実装は純粋関数）

新規ファイル `src/lib/taperPlan.ts` に UI 非依存の純粋関数として実装する。テストは表駆動（§12）。

### 3.1 入力
| 項目 | 型 | 例 | 備考 |
|---|---|---|---|
| `baselineCount` | number (1–40) | 12 | 1日の平均個数 |
| `baselineMg` | 1.5 / 3 / 6 / 8 | 6 | ZYNの実在強度から選択式（自由入力なし） |
| `pace` | `'gentle' \| 'standard' \| 'fast'` | standard | §3.2 |
| `pricePerCan` | number? | 6.00 USD | 任意。節約額表示用 |
| `pouchesPerCan` | number | 15 | ZYNは15個/缶をデフォルト |
| `startDate` | yyyy-mm-dd | 今日 | ベースライン計測を選んだ場合は計測後に確定 |

### 3.2 ペースプリセット
| ペース | 週あたり削減率（個数） | 想定総期間 | 向いている人 |
|---|---|---|---|
| Gentle | 約15% | 8–10週 | 15個/日以上、過去に一気断ちで失敗 |
| Standard | 約20–25% | 6–8週 | 標準（デフォルト） |
| Fast | 約33% | 3–4週 | 8個/日以下 |

総期間がプリセットの上限を超える場合は週数を伸ばし、下限未満なら最終週を繰り上げる。**期間ありきで削減率を潰さない。**

### 3.3 個数ラダーの生成規則
1. `limit[0] = baselineCount`（1週目は現状維持＝計測と習慣化の週。ここで減らさない）
2. 次週: `limit[n+1] = max(1, floor(limit[n] * (1 - rate)))`。ただし前週との差が1未満になる場合は `-1` を強制
3. `limit` が 2 に到達したら個数ラダー終了 → 強度ラダーへ（§3.4）
4. 各 Limit は「その週の毎日の天井」。週の途中で Limit は変えない

生成例（Standard、検証用ゴールデンケース）:

| Week | Light: 5個×6mg | Typical: 12個×6mg | Heavy: 20個×6mg |
|---|---|---|---|
| 1 | 5 | 12 | 20 |
| 2 | 4 | 10 | 17 |
| 3 | 3 | 8 | 14 |
| 4 | 3 | 6 | 11 |
| 5 | 2 | 5 | 9 |
| 6 | 2（→強度段へ） | 4 | 7 |
| 7 | – | 2（→強度段へ） | 5 |
| 8 | – | – | 3 |
| 9 | – | – | 2（→強度段へ） |

### 3.4 強度ラダー（個数が2個/日になった後）
 ritual（口に入れる動作）を残したまま用量だけ落とす最終区間。

| 段 | 内容 | 期間 |
|---|---|---|
| S1 | 2個とも現行mg（6mgなら6mg） | 個数ラダー最終週と同一 |
| S2 | 1個を次段mgに置換（6mg×1 + 3mg×1 = 9mg/日） | 1週 |
| S3 | 2個とも次段mg（3mg×2 = 6mg/日） | 1週 |
| S4 | 3mg → 1.5mg も同様に S2/S3 を繰り返す（8mg開始の人は 8→6→3→1.5） | 各1週 |
| S5 | **Zero Day** | – |

強度段の順序は `8 → 6 → 3 → 1.5 → 0` 固定。ユーザーが途中の段を在庫都合で飛ばす場合は「段をスキップ」を許可し、以降を再計算する。

### 3.5 表示用の派生値
- `dailyNicotineMg(day) = usedCount(day) * mgOf(day)`（混在日は記録の実mg合計）
- `taperProgress% = (経過したStep数 / 全Step数) * 100` ※テーパー中は Brain Rewiring バーをこの定義に差し替える（§6.2）
- `moneySaved = (baselineCount - usedCount) の累計 / pouchesPerCan * pricePerCan`（pricePerCan 未入力なら非表示）
- `projectedZeroDate = startDate + 全Step週数 * 7日`（Hold/Step-back のたびに再計算して正直に後ろ倒し表示する）

---

## 4. ウィザード（4画面・文言は確定稿）

入口: 初回起動時（既存シードデータのユーザーは対象外、Profileからのみ）／ Profile → My Plan → Start a taper

**W1 計測**
> How many pouches do you use on a normal day?
> [ステッパー: 個数]　What strength? [1.5 / 3 / 6 / 8 mg]
> Not sure of your average? [Track for 3 days first →]（§5へ）

**W2 ペース**
> How fast do you want to step down?
> ○ Standard — about 7 weeks (recommended)
> ○ Gentle — about 10 weeks, smaller drops
> ○ Fast — about 4 weeks, bigger drops
> ※週数は W1 の入力から動的計算して表示する。固定文言で嘘をつかない

**W3 プラン確認（ラダー表をそのまま見せる）**
> Your plan: 12 → 0 in 8 weeks.
> Week 1: up to 12 a day … Week 7: up to 2 a day, then strength steps … Zero day: **Mon, Jan 12, 2027**
> A daily limit is a ceiling, not a target. Coming in under it is a win.
> [Start my taper]

**W4 任意項目**
> What does a can cost you? [$ ] (optional — used only to show your savings)
> [Skip] [Save]

---

## 5. ベースライン計測モード（任意・3日間）

- `mode: 'baseline'` の間、ホームは通常表示＋「Log pouch」ボタンだけ追加。Limit は無い
- 3日分の記録が揃ったら平均（四捨五入）を W1 にプリフィルして通知バナー: `Your real average is 13 a day. Build my plan →`
- スキップ可能。その場合の推測値は使わず、W1 の手入力を正とする
- 計測日数は7日にしない（離脱が早い。3日で十分に実態が出る割り切りを仕様として明記）

---

## 6. 画面仕様

### 6.1 記録インタラクション（全画面共通）
- 記録は **1タップ +1**。誤タップ対策に長押し（500ms）で -1（取り消し）。確認ダイアログは出さない
- mgはその日の規定mgを自動適用。強度混在段（S2）ではタップごとに交互表示し、ユーザーがバッジをタップして切替可能
- 昨日の記録は Journal から翌日12:00まで修正可。それ以前はロック

### 6.2 ホーム（テーパー中は既存3メトリクスを差し替え）
| 位置 | 現行（Cold Turkey） | テーパー中 |
|---|---|---|
| 左 | SLIPS | **TODAY** `3 / 8`（使用数 / Limit） |
| 中央（featured） | STREAK | **DAY LIMIT** 残り個数を大きく: `5 left` |
| 右 | TIL NIC-FREE | **ZERO DAY** `in 34d` |
| Brain Rewiring バー | 経過÷90日 | **Taper Progress**（§3.5の定義、ラベルも差し替え） |
| レベル表示（オーブ） | First Step… | `Week 3 of 8` ＋その週の Limit |
| Panic Button | 現行モーダル | 文言追加: `Or delay the next one by 10 minutes. Set it down, set a timer, do something else first.` |

上限到達後の +1 はブロックしない（現実を記録させる）。代わりに中央表示が `Over by 1 — logged. Tomorrow's ceiling is the same.` に変わる。責める文言・赤色の警告は使わない。

### 6.3 Progress タブ
- 既存の Recovery リングは **ゼロ到達後のみ** 現行仕様。テーパー中は以下に差し替え:
  - 上部: ラダー階段図（週 × Limit のステップチャート、現在週をハイライト、Holdした週は `held` マーク）
  - ピル: `Zero Day: Jan 12, 2027`（現行の `ZYN-Free by …` ピルの置換）
  - カード差し替え: `Nicotine per day: 72mg → 24mg (-67%)` / `Money kept: $xx` / 既存の効果カードは下部に維持
- Share 文言: `I'm stepping down — Week 3 of my taper, from 12 a day to 6.`

### 6.4 Journal タブ（現行プレースホルダの実体化は本機能の範囲内）
日別行: 日付 / 使用数 / Limit / mg合計 / Over バッジ。タップで昨日の修正（§6.1）。

### 6.5 Profile タブ
My Plan セクション: 現在のペース・Zero Day・[Hold this week] [Adjust plan] [End taper]。
End taper は確認のうえ `quittr:taper:v1` を削除し Cold Turkey 表示に戻す（記録のエクスポートは Phase 2）。

---

## 7. 週次判定と例外ルール

週の区切りはプラン開始曜日起点の7日間（暦週ではない）。

### 7.1 前進（デフォルト）
週のうち Over が2日以下 → 次の段へ自動前進。演出は控えめにバナー1行のみ。

### 7.2 ホールド
Over が3日以上 → 次週も同じ Limit を自動提案し、ユーザーが [Hold] / [Push on] を選ぶ。**自動で2週連続ホールドにはしない**（停滞の固定化を防ぐ）。ホールドしても Zero Day は後ろ倒しして再表示する。

### 7.3 ステップバック
ユーザーが手動で前週の Limit に戻せる（週に1回まで）。2回目のステップバック時はペースを1段落とす（Fast→Standard→Gentle）再計算を提案する。

### 7.4 ゼロ到達と引き継ぎ
- Zero Day の朝、`mode: 'nicotine-free'` に遷移
- 既存 `StreakState` を `{ startAt: zeroDay 00:00 local, relapses: 既存値を維持, pledgedOn: null }` で初期化し、現行ホーム／Progress（90日ゴール、レベル、リング）がそのまま動き始める
- テーパー記録は読み取り専用で Journal に残る

### 7.5 一時停止・離脱
- 一時停止中は記録も判定も止め、再開時に「止まっていた日数ぶん Zero Day を後ろ倒す」か「今日から再計算」を選ばせる
- 7日間記録なし → バナーで状態確認のみ。自動でプランを消さない、罪悪感を煽らない

### 7.6 Slip との関係
テーパー中の使用は定義上 Slip ではない。`relapses` はテーパー中は加算しない。ゼロ到達後に使った場合のみ現行の Reset フロー（Slip +1）が適用される。

---

## 8. データモデル（AsyncStorageのみ・既存キー無改変）

新規ファイル `src/store/taper.ts`、キー `quittr:taper:v1`:

```ts
export type Pace = 'gentle' | 'standard' | 'fast';
export type TaperMode = 'baseline' | 'tapering' | 'paused' | 'done';

export interface TaperWeek {
  /** 0-based week index from plan start */
  index: number;
  /** daily ceiling in pouches; strength weeks use mgPlan instead */
  limit: number | null;
  /** e.g. [{mg: 6, count: 1}, {mg: 3, count: 1}] for mixed weeks */
  mgPlan: { mg: number; count: number }[] | null;
  held: boolean;
}

export interface TaperState {
  version: 1;
  mode: TaperMode;
  pace: Pace;
  baselineCount: number;
  baselineMg: number;
  pricePerCan: number | null;
  pouchesPerCan: number;
  /** yyyy-mm-dd (local) the plan (or baseline tracking) started */
  startDate: string;
  weeks: TaperWeek[];
  /** yyyy-mm-dd -> pouches used that day */
  usage: Record<string, { count: number; mgTotal: number }>;
  pausedAt: string | null;
}
```

- バリデーションは既存 `isStreakState` と同方式の型ガード `isTaperState` を用意し、壊れたデータはプラン無し状態にフォールバック（ストリークには影響させない）
- `usage` は肥大化防止のため Zero Day 確定後は日別集計のみ保持（時刻を持たないので自然に小さい）
- 日付キーは既存 `todayKey()` を再利用する

新規フック `src/hooks/useTaper.ts`: `useStreak` と同パターン（load/save、20秒tick不要、派生値: `todayCount / todayLimit / remaining / currentWeek / zeroDate / taperProgress / moneySaved`）。

---

## 9. 実装タスク分解（この順で実装する）

| # | ファイル | 内容 |
|---|---|---|
| 1 | `src/lib/taperPlan.ts`（新規） | ラダー生成・mg計算・Zero Day算出の純粋関数＋単体テスト |
| 2 | `src/store/taper.ts`（新規） | §8の型・load/save・型ガード |
| 3 | `src/hooks/useTaper.ts`（新規） | 派生値と記録アクション（log / undo / hold / stepBack / pause / resume / end） |
| 4 | `app/(tabs)/index.tsx`（改修） | テーパー時のメトリクス差し替え、Log ボタン、Panic文言分岐 |
| 5 | `app/(tabs)/progress.tsx`（改修） | ラダー階段図、ピル・カード差し替え |
| 6 | `app/(tabs)/journal.tsx`（改修） | 日別記録リストと昨日修正 |
| 7 | `app/(tabs)/profile.tsx`（改修） | My Plan セクション |
| 8 | `app/taper-setup.tsx`（新規ルート） | ウィザード W1–W4（タブ外のスタック画面） |
| 9 | `src/components/TaperLadder.tsx`（新規） | 階段図（react-native-svg、導入済み） |
| 10 | 引き継ぎ処理 | Zero Day 遷移で `saveStreak` を呼ぶ（§7.4） |

新規依存は **ゼロ**（通知を入れないため）。`tsc --noEmit` と `expo-doctor` を従来どおり通すこと。

---

## 10. エッジケース

- **日付境界**: 日の区切りは端末ローカル 00:00（`todayKey` 準拠）。旅行でTZが変わってもキー基準で一貫させる
- **開始日のシード衝突**: 既存のデモ用シード（90d 1h 1m / slips 2）ユーザーにはウィザードを自動表示しない
- **上限0の日**: 存在しない。最小 Limit は1、次は強度段か Zero Day
- **40個/日超の入力**: ステッパー上限40。40超は Gentle 固定＋期間が10週を超える旨を表示（医療機関への相談を勧める一文を §11 の範囲で添える）
- **途中の強度変更**（在庫都合で先に3mgへ等）: その週の `mgPlan` を手動上書き可。以降の段は再計算
- **プラン削除後の再作成**: 前回の baseline を初期値として提示する

---

## 11. 文言・安全ガードレール

- 「必ずやめられる」「成功率○%」等の効果保証・数値は UI にもストア文にも入れない
- ウィザード末尾に固定の一文: `This app supports your plan — it isn't medical advice. If you're pregnant, have a heart condition, or feel unwell while stepping down, talk to a doctor or pharmacist.`
- NRT（パッチ／ガム）の用量提案はしない。アプリはポーチの記録と計画だけを扱う
- Over／Hold／Step-back の文言はすべて非難を含まない形に統一（§6.2、§7 の稿が正）

---

## 12. 受け入れ基準・テスト

### 自動（純粋関数）
- [ ] §3.3 のゴールデンケース3件（5 / 12 / 20個）が表と完全一致する
- [ ] どの入力でも Limit 列は単調非増加、最小1、必ず強度段か Zero に収束する
- [ ] 強度段: 8mg開始は `8→6→3→1.5`、3mg開始は `3→1.5` の段列になる
- [ ] Hold を挟むと Zero Day がちょうど7日後ろ倒しになる
- [ ] `moneySaved`: 12個/日→6個/日を7日、15個/缶・$6 で $16.80 になる

### 手動QA
- [ ] 初回起動（新規）でモード選択が出る／既存シードでは出ない
- [ ] +1 長押しで取り消せる、上限超過しても Slip が増えない
- [ ] 日付を跨ぐと TODAY がリセットされ、Journal に前日分が残る
- [ ] Zero Day 翌日に現行ホーム（ストリーク1日目）が表示される
- [ ] アプリ再起動・Expo Go 再読込でもプランと記録が保持される
- [ ] `tsc` 通過、Web export で全タブ描画確認（従来の納品手順と同じ）

---

## 13. 根拠メモ

- 個数と強度は同時に下げず、1レバーずつ・段を保持して進めるのが step-down の定石。強度ラダーは実在製品の段（extra strong → strong → regular → 6mg → 3mg → 1.5mg mini → 0）に対応させる
- 使用量別の期間目安: 1–3個/日は一気断ち可、4–8個は2–3週、9–15個は4–6週、15個超は6–10週のテーパー
- 競合（quittingzyn.app / SnusFree型）の型: 「まず1週間数える」「週15–25%削減」「上限は目標でなく天井」「最後の1個は気分でなく日付で決める」を採用。ただし計測期間は離脱率を考慮し当アプリでは3日に短縮（§5）
- 強度切替（6mg→3mg）は 50/50交互 → 75%低強度 → 全量切替の混在週が実践されており、§3.4 の S2（混在週）はこれを簡略化したもの

---

## 14. ユウの判断が要る点（実装前に確定したい3つ）

1. **ベースライン計測のデフォルト**: 推奨は「手入力をデフォルト、計測は任意」。計測を必須にすると初日の離脱が増える
2. **Over の扱い**: 推奨は本仕様どおり「Slipにしない」。もし従来どおり厳しくするなら §7.6 を差し替える
3. **デフォルトペース**: 推奨は Standard（6–8週）。Fast をデフォルトにすると序盤の離脱症状で離脱しやすい

上記3点が決まれば、この仕様のまま実装に入れる。
