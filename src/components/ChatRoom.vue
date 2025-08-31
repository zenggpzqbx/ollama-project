<script setup>
import { ref, reactive } from "vue";
import KeyManager from "@utils/KeyManager.js";
import RealInfoSet from "@/utils/realInfo/RealInfoSet";
import _ from "lodash";

console.log(RealInfoSet, "toolSet");
const chatMessages = ref([]);
const renderMessage = computed(() => {
  return chatMessages.value.filter(item => !!item.content && ["user","assistant"].includes(item.role));
});

const textArea = ref("");
const chatBox = ref("");

function generateTextByFetch() {
  return fetch("https://api.deepseek.com/chat/completions", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KeyManager.DeepseekKey}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: chatMessages.value,
      stream: true,
      tools: [RealInfoSet.getWeatherTool()]
    })
  });
}

const currentRequestTool = [];

function handleStreamData() {
  generateTextByFetch().then(async res => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    const message = reactive({ role: "assistant", content: "" });
    chatMessages.value.push(message);
    while (true) {
      try {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(item => !!item.trim());
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const value = line.slice(6);
          if (value === "[DONE]") continue;
          const data = JSON.parse(value);
          data?.choices?.map((choice) => {
            if (choice.delta.content) {
              message.content += choice.delta.content;
            }
            if (choice.delta.tool_calls) {
              choice.delta.tool_calls.forEach((c) => {
                const hasCall = currentRequestTool.find(item => item.index === c.index);
                if (hasCall) {
                  hasCall.function.arguments += c.function.arguments;
                } else {
                  currentRequestTool.push({
                    index: c.index,
                    id: c.id,
                    type: c.type,
                    function: {
                      name: c.function.name,
                      arguments: c.function.arguments
                    }
                  });
                }
              });
            }
            ;
          });
          handleChatBoxScroll();
        }
      } catch (err) {
        await reader.cancel();
      }
    }
    if (currentRequestTool.length) {
      console.log(currentRequestTool, "===");
      currentRequestTool.forEach(item => {
        const props = JSON.parse(item.function.arguments);
        RealInfoSet[item.function.name](props.city || "110000").then(res => {
          console.log(res, "天气调用完成！");
          const { status, data } = res;
          if (status === 200) {
            const value = data.lives[0];
            const info = `${value.city}的天气描述，实时气温：${value.temperature}摄氏度, 天气现象是:${value.weather}, 风向：${value.winddirection}, 风力级别：${value.windpower}级`;
            console.log(info, "info");
            chatMessages.value.push(
              { role: "assistant", tool_calls: _.cloneDeep(currentRequestTool) },
              { role: "tool", content: info, tool_call_id: item.id }
            );
            currentRequestTool.length = 0;
            console.log("vix;");
            handleStreamData();
          }
        }).catch(err => currentRequestTool.length = 0);
      });
    } else {
      await reader.cancel();
    }
  });
}

function handleChatBoxScroll() {
  chatBox.value.scrollTo({
    behavior: "smooth",
    top: chatBox.value.scrollHeight
  });
}


function handleKeyDownEvent(e) {
  if (e.keyCode === 13 && e.ctrlKey) {
    textArea.value += "\n";
  }
  if (e.keyCode === 13 && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    chatMessages.value.push({ role: "user", content: String(textArea.value).trim() });
    nextTick(() => {
      handleChatBoxScroll();
    });
    handleStreamData();

    textArea.value = "";
    e.preventDefault();
  }
}
</script>

<template>
  <div class="chat-container">
    <div class="chat-box" ref="chatBox">
      <div v-for="(item,index) in renderMessage" :key="index"
           :class="['message-default',item.role === 'user'?'message-client':'message-server']"
      >
        {{ item.content }}
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
