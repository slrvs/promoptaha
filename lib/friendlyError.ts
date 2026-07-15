export function getFriendlyErrorMessage(error: unknown) {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : typeof error === "object" &&
            error !== null &&
            "message" in error &&
            typeof error.message === "string"
          ? error.message
          : "Сталася помилка. Спробуй ще раз.";

  const message = rawMessage.toLowerCase();

  if (
    message.includes("максимум 15 промокодів") ||
    message.includes("enforce_promo_code_insert_limit")
  ) {
    return "Ти досяг ліміту: максимум 15 промокодів за 24 години. Спробуй пізніше.";
  }

  if (
    message.includes("максимум 30 коментарів") ||
    message.includes("максимум 120 коментарів") ||
    message.includes("enforce_comment_insert_limit")
  ) {
    return "Ти тимчасово досяг ліміту коментарів. Спробуй написати пізніше.";
  }

  if (
    message.includes("максимум 5 заявок") ||
    message.includes("enforce_store_request_insert_limit")
  ) {
    return "Ти досяг ліміту: максимум 5 заявок магазинів за 24 години. Спробуй пізніше.";
  }

  if (message.includes("row-level security")) {
    return "Немає доступу для цієї дії. Перевір, чи ти увійшов в акаунт.";
  }

  if (message.includes("duplicate key")) {
    return "Такий запис уже існує.";
  }

  if (message.includes("invalid login credentials")) {
    return "Неправильний email або пароль.";
  }

  if (message.includes("email not confirmed")) {
    return "Потрібно підтвердити email. Перевір пошту.";
  }

  if (message.includes("already registered")) {
    return "Користувач із таким email вже зареєстрований.";
  }

  if (message.includes("captcha")) {
    return "У Supabase досі може бути увімкнена CAPTCHA. Якщо ми її пропускаємо — вимкни CAPTCHA protection у Supabase Dashboard.";
  }

  if (message.includes("network")) {
    return "Проблема з мережею. Перевір інтернет і спробуй ще раз.";
  }

  return rawMessage;
}