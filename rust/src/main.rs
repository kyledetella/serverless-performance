use lambda::{handler_fn, Context};
use serde::Serialize;
use serde_json::{json, Value};
use std::time::{SystemTime, UNIX_EPOCH};

type Error = Box<dyn std::error::Error + Sync + Send + 'static>;

#[derive(Serialize)]
struct HandlerResult {
  status: String,
  message: String,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
  lambda::run(handler_fn(handler)).await?;
  Ok(())
}

async fn handler(event: Value, _: Context) -> Result<Value, Error> {
  println!("Event: {}", event);

  let handler_result = HandlerResult {
    status: "Ok".to_owned(),
    message: format!(
      "Completed at: {:?}",
      SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis()
    ),
  };

  Ok(json!(&handler_result))
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  #[tokio::test]
  async fn handler_handles() {
    let event = json!({
      "answer": 42
    });

    assert_eq!(
      handler(event.clone(), Context::default())
        .await
        .expect("expected Ok(_) val"),
      event
    )
  }
}
