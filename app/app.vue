<template>
  <div class="page">
    <main class="shell">
      <header class="hero">
        <p class="eyebrow">ZUAN LAB / CORE</p>
        <h1>优雅的嘴炮引擎</h1>
        <p class="sub">
          轻点一下，随机抽取词条并自动复制。你只需要选好火力档位。
        </p>
      </header>

      <section class="panel">
        <div class="controls">
          <div class="level-group">
            <button
              v-for="option in levelOptions"
              :key="option.value"
              class="level"
              :class="{ active: selectedLevel === option.value }"
              type="button"
              @click="selectedLevel = option.value"
            >
              <span class="level-title">{{ option.label }}</span>
              <span class="level-hint">{{ option.hint }}</span>
            </button>
          </div>

          <div class="actions">
            <button
              class="cta"
              type="button"
              :disabled="loading"
              @click="fetchZuan"
            >
              <span v-if="loading" class="spinner" aria-hidden="true"></span>
              <span>{{ loading ? '抽取中' : '开骂' }}</span>
            </button>

            <div class="status" :class="copyStatus">
              {{ statusText }}
            </div>
          </div>
        </div>

        <div class="output" :class="{ empty: !result }">
          <div class="output-head">
            <span class="label">当前词条</span>
            <span class="badge" v-if="resultLevel">
              {{ levelLabel(resultLevel) }}
            </span>
            <span class="badge ghost" v-else>等待抽取</span>
          </div>

          <p class="output-text">
            {{ result || '点击按钮开始生成，自动复制会在成功后触发。' }}
          </p>

          <div class="output-foot">
            <div class="output-actions">
              <button
                class="ghost-btn"
                type="button"
                :disabled="!result"
                @click="copyAgain"
              >
                重新复制
              </button>
              <button
                class="ghost-btn"
                type="button"
                :disabled="history.length === 0"
                @click="showHistory = !showHistory"
              >
                {{ showHistory ? '收起历史' : `历史(${history.length})` }}
              </button>
            </div>
            <span v-if="errorMessage" class="error">{{ errorMessage }}</span>
          </div>
        </div>

        <div v-show="showHistory" class="history">
          <div class="history-head">
            <span class="label">最近记录</span>
            <button
              class="ghost-btn tiny"
              type="button"
              :disabled="history.length === 0"
              @click="clearHistory"
            >
              清空
            </button>
          </div>

          <p v-if="history.length === 0" class="history-empty">暂无记录</p>
          <ul v-else class="history-list">
            <li v-for="item in history" :key="item.key" class="history-item">
              <p class="history-text">{{ item.text }}</p>
              <div class="history-meta">
                <span class="badge ghost">{{ levelLabel(item.level) }}</span>
                <button
                  class="ghost-btn tiny"
                  type="button"
                  @click="copyText(item.text)"
                >
                  复制
                </button>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <footer class="footer">

        <span>等级：min / max</span>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
type Level = 'min' | 'max' | 'all'

const levelOptions: Array<{ value: Level; label: string; hint: string }> = [
  { value: 'all', label: '无所谓', hint: '随机走位' },
  { value: 'min', label: '口吐莲花', hint: '柔和但精准' },
  { value: 'max', label: '火力全开', hint: '满格攻击' }
]

const selectedLevel = ref<Level>('all')
const result = ref('')
const resultLevel = ref<Level | ''>('')
const loading = ref(false)
const showHistory = ref(false)
const history = ref<Array<{ key: number; text: string; level: Level }>>([])
const historyLimit = 10
let historyKey = 0
const copyStatus = ref<'idle' | 'copied' | 'error'>('idle')
const statusText = computed(() => {
  if (copyStatus.value === 'copied') return '已复制到剪贴板'
  if (copyStatus.value === 'error') return '复制失败'
  return '自动复制待命'
})
const errorMessage = ref('')

function levelLabel(level: Level | '') {
  if (!level) return ''
  return levelOptions.find((option) => option.value === level)?.label || level
}

function formatError(message: string) {
  if (message === 'empty') return '库里还没有词条'
  if (message === 'invalid level') return '等级参数不合法'
  return message
}

async function copyText(text: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    copyStatus.value = 'error'
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    copyStatus.value = 'copied'
  } catch {
    copyStatus.value = 'error'
  }
}

async function fetchZuan() {
  loading.value = true
  errorMessage.value = ''
  copyStatus.value = 'idle'
  try {
    const data = await $fetch<{ id: number; text: string; level: Level }>(
      '/api/zuan',
      {
        query: {
          level: selectedLevel.value
        }
      }
    )
    result.value = data.text
    resultLevel.value = data.level
    addHistory(data.text, data.level)
    await copyText(data.text)
  } catch (error: any) {
    resultLevel.value = ''
    const message = error?.data?.statusMessage || error?.message || '获取失败，请稍后重试'
    errorMessage.value = formatError(message)
    copyStatus.value = 'error'
  } finally {
    loading.value = false
  }
}

async function copyAgain() {
  if (!result.value) return
  await copyText(result.value)
}

function addHistory(text: string, level: Level) {
  historyKey += 1
  history.value = [{ key: historyKey, text, level }, ...history.value].slice(
    0,
    historyLimit
  )
}

function clearHistory() {
  history.value = []
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');

:root {
  --bg: #0b0f16;
  --panel: rgba(15, 20, 32, 0.82);
  --panel-strong: rgba(28, 36, 52, 0.86);
  --ink: #e7ecf5;
  --muted: #9fb1cf;
  --accent: #57f0c1;
  --accent-2: #ffb86b;
  --stroke: rgba(120, 148, 189, 0.25);
  --glow: rgba(87, 240, 193, 0.25);
  --font-display: 'Space Grotesk', 'IBM Plex Sans', system-ui, sans-serif;
  --font-body: 'IBM Plex Sans', system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-body);
  background: radial-gradient(circle at top left, #1c2a3f 0%, transparent 45%),
    radial-gradient(circle at 20% 30%, rgba(87, 240, 193, 0.2) 0%, transparent 35%),
    radial-gradient(circle at 80% 20%, rgba(255, 184, 107, 0.25) 0%, transparent 40%),
    var(--bg);
  color: var(--ink);
  min-height: 100vh;
}
</style>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 20px 64px;
  position: relative;
  overflow: hidden;
}

.page::before,
.page::after {
  content: '';
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.35;
  z-index: 0;
}

.page::before {
  background: #57f0c1;
  left: -120px;
  top: 20px;
}

.page::after {
  background: #ffb86b;
  right: -120px;
  bottom: 40px;
}

.shell {
  position: relative;
  z-index: 1;
  width: min(960px, 100%);
  display: grid;
  gap: 28px;
}

.hero {
  display: grid;
  gap: 12px;
}

.eyebrow {
  letter-spacing: 0.24em;
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
}

h1 {
  font-family: var(--font-display);
  font-size: clamp(32px, 4vw, 48px);
  margin: 0;
}

.sub {
  margin: 0;
  color: var(--muted);
  font-size: 16px;
  max-width: 560px;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--stroke);
  border-radius: 24px;
  padding: 24px;
  display: grid;
  gap: 20px;
  box-shadow: 0 30px 80px rgba(6, 10, 18, 0.6);
  backdrop-filter: blur(18px);
}

.controls {
  display: grid;
  gap: 18px;
}

.level-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.level {
  border: 1px solid transparent;
  background: var(--panel-strong);
  color: var(--ink);
  padding: 14px 16px;
  border-radius: 16px;
  text-align: left;
  display: grid;
  gap: 6px;
  cursor: pointer;
  transition: border 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.level:hover {
  border-color: rgba(87, 240, 193, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 14px 40px rgba(9, 14, 25, 0.45);
}

.level.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent), 0 18px 40px var(--glow);
}

.level-title {
  font-weight: 600;
  font-size: 16px;
}

.level-hint {
  color: var(--muted);
  font-size: 13px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.cta {
  border: none;
  border-radius: 999px;
  background: linear-gradient(120deg, var(--accent), #2fc8ff);
  color: #041014;
  padding: 12px 26px;
  font-weight: 700;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  box-shadow: 0 16px 30px rgba(47, 200, 255, 0.2);
  transition: transform 0.2s ease;
}

.cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cta:not(:disabled):hover {
  transform: translateY(-2px);
}

.spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(4, 16, 20, 0.35);
  border-top-color: #041014;
  animation: spin 0.8s linear infinite;
}

.status {
  font-size: 13px;
  color: var(--muted);
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
}

.status.copied {
  color: #041014;
  background: rgba(87, 240, 193, 0.2);
  border-color: rgba(87, 240, 193, 0.4);
}

.status.error {
  color: #2b0b00;
  background: rgba(255, 107, 107, 0.2);
  border-color: rgba(255, 107, 107, 0.4);
}

.output {
  background: rgba(8, 12, 20, 0.7);
  border: 1px solid var(--stroke);
  border-radius: 20px;
  padding: 20px;
  display: grid;
  gap: 16px;
  min-height: 180px;
}

.output.empty {
  color: var(--muted);
}

.output-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.label {
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
}

.badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(87, 240, 193, 0.2);
  color: var(--accent);
  border: 1px solid rgba(87, 240, 193, 0.4);
}

.badge.ghost {
  color: var(--muted);
  border-color: rgba(120, 148, 189, 0.3);
  background: rgba(120, 148, 189, 0.1);
}

.output-text {
  margin: 0;
  font-size: clamp(18px, 2.3vw, 22px);
  line-height: 1.6;
  font-weight: 500;
  white-space: pre-wrap;
}

.output-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.output-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.ghost-btn {
  border: 1px solid var(--stroke);
  background: transparent;
  color: var(--ink);
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 13px;
  transition: border 0.2s ease, transform 0.2s ease;
}

.ghost-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.ghost-btn:not(:disabled):hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.ghost-btn.tiny {
  padding: 6px 12px;
  font-size: 12px;
}

.history {
  background: rgba(9, 14, 24, 0.65);
  border: 1px dashed rgba(120, 148, 189, 0.25);
  border-radius: 18px;
  padding: 16px;
  display: grid;
  gap: 12px;
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.history-empty {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.history-item {
  border: 1px solid rgba(120, 148, 189, 0.2);
  border-radius: 14px;
  padding: 12px;
  display: grid;
  gap: 10px;
  background: rgba(20, 28, 40, 0.6);
}

.history-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.history-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.error {
  color: #ff9c9c;
  font-size: 13px;
}

.footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--muted);
  font-size: 12px;
  flex-wrap: wrap;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .panel {
    padding: 18px;
  }

  .actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .output-foot {
    flex-direction: column;
    align-items: flex-start;
  }

  .history-meta {
    width: 100%;
  }
}
</style>
