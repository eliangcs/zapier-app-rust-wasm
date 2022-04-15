# Hello, WASM!

An example project setup that shows how you can use Rust and WebAssembly in a
Zapier CLI app.

## Project setup

```bash
# Install dependencies
yarn

# Compile Rust code
yarn build

# Run tests
zapier test

# Run a specific test case
yarn test -t 'make a request'

# To debug a specific test case
yarn test:debug -t 'make a request'

# Register the integration on Zapier if you haven't
zapier register 'hello-wasm'

# Or you can link to an existing integration on Zapier
zapier link

# Push it to Zapier
zapier push
```

Find out more on the latest docs: https://github.com/zapier/zapier-platform/blob/master/packages/cli/README.md.

## How it works

In `package.json`, you can see `yarn build` actually runs this `wasm-pack`
command to build Rust code:

```
wasm-pack build --target nodejs --no-typescript
```

[wasm-pack][wasm-pack] is the de-faco tool for building WebAssembly modules
using Rust. `yarn build` uses wasm-pack to compile Rust code inside `src/`
directory, and produce two files:

- `hello_wasm_bg.wasm`: the wasm module. It's a binary file. To see what's
  actually inside, you can use the wasm2wat tool, included in the [WABT][wabt]
  toolkit, to convert it to the text format. The `bg` in the filename stands for
  "bindgen", indicating that it's internal for wasm-bindgen.
- `hello_wasm.js`: the glue code generated by [wasm-bindgen][wasm-bg]. Any other
  JavaScript modules won't use `hello_wasm_bg.wasm` directly. Instead, they have
  to import `hello_wasm.js` and should only use its exported interface.

By default, `hello_wasm_bg.wasm` is not include by `zapier build`. So in
`.zapierapprc`, we have to include it explicitly:

```json
{
  "id": 123,
  "key": "App123",
  "includeInBuild": [
    "hello_wasm_bg.wasm"
  ]
}
```

I did a test to compute `fib(43)` on the Zapier editor. This is how they
performed:

| JavaScript              | WebAssembly                 |
|-------------------------|-----------------------------|
| ![JS: 19.3s][result_js] | ![WASM: 10.2s][result_wasm] |

So 19.3s vs. 10.2s ≈ 89% faster.

## Example 1: computing a Fibonacci number

WebAssembly is best for CPU-bound work. This Fibonacci function is a good
example of that:

```javascript
// creates/fib.js
const fib = (n) => {
  if (n <= 1) {
    return n;
  }
  return fib(n - 1) + fib(n - 2);
};
```

This is a purposely bad implementation, so later we can see how fast WebAssembly
can be. This is how it's implemented in Rust:

```rust
// src/lib.rs
#[wasm_bindgen]
pub fn fib(n: u32) -> u32 {
    match n {
        0 | 1 => n,
        _ => fib(n - 1) + fib(n - 2),
    }
}
```

The `#[wasm_bindgen]` macro is where wasm-bindgen performs its magic, generating
the JavaScript and Rust glue code, so they can talk to each other.

## Example 2: making a request

This example is only for fun. I don't recommend you do it, since you'd have to
deal with the type conversion mess between WebAssembly and JavaScript.

This is because WebAssembly can't do I/Os. You can't read a file like you'd
normally do in Rust. The following code will still compile but it will panic at
runtime:

```rust
// src/lib.rs
pub fn read_to_string() -> String {
    fs::read_to_string("./README.md").expect("Something went wrong reading the file")
}
```

However, WebAssembly allows you to import and call JavaScript functions. So if
you wanted to do I/Os, like making a request, you'd have to do it in JavaScript,
import it, and call it from WebAssembly.

I've come up with an example of how we can take object arguments from JavaScript
and invoke `z.request()` in Rust. And it's not easy:

```rust
// src/lib.rs
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

#[wasm-bindgen]
pub async fn perform_request(
    z: ZObject,
    bundle_from_js: JsValue,
) -> Result<JsValue, JsValue> {
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
```

Not only do we have to serialize/deserialize to convert data between JavaScript
and WebAssembly (using [serde][serde]), but we also have to glue promises (using
[js-sys][js-sys]) between the two worlds.


[js-sys]: https://rustwasm.github.io/wasm-bindgen/contributing/js-sys/index.html
[result_js]: https://cdn.zappy.app/ddd65804f70eaf6145848bbb816e09c4.png
[result_wasm]: https://cdn.zappy.app/10dfdd3c0cf2105e1b0551fdd9290855.png
[serde]: https://serde.rs
[wabt]: https://github.com/WebAssembly/wabt
[wasm-bg]: https://github.com/rustwasm/wasm-bindgen
[wasm-pack]: https://github.com/rustwasm/wasm-pack