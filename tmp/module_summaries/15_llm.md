# 模块：src/llm

## 模块功能摘要

通用文本生成后端层，负责统一生成协议、LiteLLM 后端、本地 CLI 后端、后端选择、生成参数治理、错误恢复、Hermes 路由、prompt cache 能力判断、usage/token/cache telemetry 标准化。

## 关键文件职责

| 文件 | 职责 |
|---|---|
| `generation_backend.py` | 统一生成协议、结果和错误模型。 |
| `backend_factory.py` | 根据 backend ID 创建生成后端。 |
| `litellm_backend.py` | 包装 LiteLLM completion 调用。 |
| `local_cli_backend.py` | 本地 CLI 生成后端。 |
| `backend_registry.py` | 后端 ID 规范化、主/备用/Agent 后端解析。 |
| `generation_params.py` | LiteLLM wire model、temperature、thinking、参数恢复策略。 |
| `errors.py` | LiteLLM 参数错误分类和自动恢复调用。 |
| `hermes.py` | Hermes channel/model 引用解析、过滤和错误清洗。 |
| `provider_cache.py` | provider prompt cache 能力和 hints。 |
| `usage.py` | usage 标准化、消息 HMAC、审计信息。 |

## 主要接口与出入参说明

### `GenerationBackend.generate(...)`

- 输入：`prompt`、`generation_config`、可选 `system_prompt`、`stream`、流式回调、响应校验器、审计上下文。
- 输出：`GenerationResult`。
- 副作用：由具体后端决定，可能调用远端 LLM 或本地进程。

### `GenerationResult`

- 输入/字段：`text`、`model`、`provider`、`backend`、`usage`、`raw`、`diagnostics`。
- 输出：统一生成结果对象。

### `GenerationError`

- 输入：错误码、阶段、是否可重试/可 fallback、后端、provider、详情。
- 输出：结构化异常。

### `create_generation_backend(backend_id, config, litellm_completion_callable=None)`

- 输入：后端 ID、配置对象、可选 LiteLLM callable。
- 输出：`LiteLLMGenerationBackend` 或 `LocalCliGenerationBackend`。
- 副作用：实例化对象；未知后端或 callable 缺失时抛 `GenerationError`。

### `LiteLLMGenerationBackend.generate(...)`

- 输入：统一生成参数。
- 输出：`GenerationResult(text, model, provider, backend='litellm', usage)`。
- 副作用：调用传入 completion callable。
- 能力：JSON、tools、stream；不支持 vision。

### `LocalCliGenerationBackend.generate(...)`

- 输入：prompt、配置、system prompt、stream 标志、校验器。
- 输出：`GenerationResult`。
- 副作用：创建临时目录，写 prompt/stdout/stderr 文件，启动本地子进程，读取输出。
- 主要错误：命令不存在、不可执行、超时、非零退出、空输出、输出过大、JSON 校验失败、交互/登录提示。

### 后端解析

- `normalize_backend_id(value, default)`：输出标准后端 ID。
- `resolve_generation_backend_id(config)`：输出主后端。
- `resolve_generation_fallback_backend_id(config)`：输出 fallback 后端或 `None`。
- `resolve_agent_generation_backend_id(config)`：输出 Agent 专用后端。
- 副作用：非法后端抛 `GenerationError`。

### LiteLLM 参数治理

- `resolve_litellm_wire_model(...)`：输出实际 wire model。
- `resolve_litellm_thinking_enabled(...)`：输出 thinking 是否启用。
- `normalize_litellm_temperature(...)`：输出规范 temperature。
- `apply_litellm_generation_params(call_kwargs, model, temperature, default_temperature, model_list, request_overrides)`：输出更新后的调用参数。
- 副作用：可读写进程内参数恢复缓存。

### 错误恢复与 Hermes

- `classify_litellm_generation_param_error(error)`：输出参数错误分类。
- `call_litellm_with_param_recovery(...)`：可能调整参数并重试调用。
- `parse_hermes_channel(...)`、`canonicalize_hermes_model_ref(raw_model)`、`normalize_hermes_models(models)`、`filter_non_hermes_deployments(model_list)`、`sanitize_hermes_error_text(...)`：输入 channel/model/错误文本，输出标准引用、过滤列表或清洗文本。

### Prompt Cache / Usage

- `build_provider_cache_route_context(...)` / `resolve_provider_cache_caps(...)` / `apply_prompt_cache_hints(...)` / `filter_prompt_cache_telemetry(...)`：输入 provider/route/messages/usage，输出 cache 能力、hints 和诊断。
- `extract_usage_payload(response)` / `normalize_litellm_usage(...)`：输出标准 usage。
- `attach_message_hmacs(...)` / `build_message_hmacs(...)` / `build_domain_hmac(...)`：输出审计 HMAC；可能读取 HMAC secret 文件。

## 关联模块

- 被调用：`src/agent/llm_adapter.py`、分析器、系统配置测试、生成后端状态服务。
- 依赖：配置、LiteLLM、本地 CLI、可选 Hermes 路由。
