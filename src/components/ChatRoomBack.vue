<script setup>
import { ref, reactive } from "vue";
const  APIKEY = "sk-592663be607b4aca81a30591c2ec3ab1"
function generateTextByFetch(prompt) {
  const data = [...contextMessages.value, prompt].join(";")
  return fetch("/api/generate", {
    method: "post",
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache"
    },
    body: JSON.stringify({
      model: "deepseek-r1:7b",   // 换成你本地已 pull 的模型
      prompt:data,
      stream: true
    })
  });
}


function handleStreamData(prompt) {
  generateTextByFetch(prompt).then(async res => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    const message = reactive({ type: "server", data: "" });
    chatMessages.value.push(message);
    while (true) {
      try {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(item => !!item.trim());
        for (const line of lines) {
          const data = JSON.parse(line);
          message.data += data.response;
          handleChatBoxScroll();
        }
      } catch (err) {
        await reader.cancel();
      }
    }
    await reader.cancel();
  });
}

const chatMessages = ref([]);
const contextMessages = computed(() => {
  const length = chatMessages.value.length;
  if (length <= 20) {
    return chatMessages.value.map(item => `${item.type}: ${item.data}`);
  }
  return chatMessages.value.slice(length-20).map(item => `${item.type}: ${item.data}`);
})
const textArea = ref("");
const chatBox = ref("");

function handleChatBoxScroll() {
  chatBox.value.scrollTo({
    behavior: "smooth",
    top: chatBox.value.scrollHeight
  });
}

function handleSendEvent(value) {
  chatMessages.value.push({ type: "client", data: String(value).trim() });
  handleStreamData(value);
  handleChatBoxScroll();
}

function handleKeyDownEvent(e) {
  if (e.keyCode === 13 && e.ctrlKey) {
    textArea.value += "\n";
  }
  if (e.keyCode === 13 && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    handleSendEvent(String(textArea.value).trim());
    textArea.value = ""
    e.preventDefault();
  }
}
</script>

<template>
  <div class="chat-container">
    <div class="chat-box" ref="chatBox">
      <div v-for="(item,index) in chatMessages" :key="index"
           :class="['message-default',item.type === 'client'?'message-client':'message-server']"
      >
        {{ item.data }}
      </div>
    </div>
    <div class="chat-message">
      <el-input v-model="textArea"
                :rows="10"
                :autosize="{ minRows: 2, maxRows: 10 }"
                autofocus
                type="textarea"
                placeholder="请输入你的问题！按ctrl+enter回车"
                @keydown.stop="handleKeyDownEvent"
      ></el-input>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.chat-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.message-default {
  min-width: 0;
  max-width: calc(100% - 300px);
  width: fit-content;
  word-wrap: break-word;
  word-break: normal;
  border-radius: 10px;
  padding: 10px;
}

.message-client {
  background-color: blanchedalmond;
  text-align: right;
  align-self: end;
}

.message-server {
  background-color: aliceblue;
  text-align: left;
  margin: 20px 0;
}


.chat-message {
  width: 100%;
  display: flex;
  padding: 10px;
  align-items: center;
}
</style>
