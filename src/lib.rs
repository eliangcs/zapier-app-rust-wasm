mod utils;

use js_sys::Promise;
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use std::fs;
use utils::set_panic_hook;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen(start)]
pub fn init() {
    // So we have a better error message when it panics
    set_panic_hook();
}

#[wasm_bindgen]
pub fn fib(n: u32) -> u32 {
    match n {
        0 | 1 => n,
        _ => fib(n - 1) + fib(n - 2),
    }
}

#[wasm_bindgen]
extern "C" {
    pub type ZObject;

    #[wasm_bindgen(structural, method)]
    fn request(this: &ZObject, options: &JsValue) -> JsValue;
}

#[derive(Serialize, Deserialize)]
pub struct Bundle {
    #[serde(rename = "inputData")]
    pub input_data: Map<String, Value>,
}

#[derive(Serialize, Deserialize)]
struct Request {
    url: String,
    method: String,
    body: Map<String, Value>,
}

#[derive(Serialize, Deserialize)]
struct Response {
    status: i32,
    content: String,
    #[serde(default)]
    parsed_content: Value,
}

#[wasm_bindgen]
pub async fn perform_request(
    z: ZObject,
    bundle_from_js: JsValue,
) -> Result<JsValue, JsValue> {
    // Only for demo. For production, we should probably handle errors better rather than just
    // using unwrap().
    let bundle: Bundle = bundle_from_js.into_serde().unwrap();
    let message = bundle
        .input_data
        .get("message")
        .unwrap_or(&json!(""))
        .clone();
    let mut body: Map<String, Value> = Map::new();
    body.insert(String::from("message"), message);

    let options = Request {
        url: String::from("https://httpbin.zapier-tooling.com/post"),
        method: String::from("POST"),
        body: body,
    };
    let options_for_js = JsValue::from_serde(&options).unwrap();

    let response_promise = Promise::from(z.request(&options_for_js));
    let response_for_js = JsFuture::from(response_promise).await?;

    let mut response: Response = response_for_js.into_serde().unwrap();
    response.parsed_content = serde_json::from_str(&response.content).unwrap();

    Ok(JsValue::from_serde(&response).unwrap())
}

#[wasm_bindgen]
pub fn read_to_string() -> String {
    // 🙅 Don't do this. WebAssembly can't do I/Os. This compiles but will panic "unreachable" at
    // runtime.
    fs::read_to_string("./README.md").expect("Something went wrong reading the file")
}
