// Файл: LocalEventEmitter.ts
type EventMap = Record<string, any>; // Базовый тип для всех возможных событий

class LocalEventEmitter<T extends EventMap> {
  private listeners: {
    [K in keyof T]?: Array<(data: T[K]) => void>;
  } = {};

  /**
   * Подписка на событие
   * @param eventName Название события
   * @param callback Функция-обработчик
   */
  on<K extends keyof T>(eventName: K, callback: (data: T[K]) => void) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName]!.push(callback);
  }

  /**
   * Отписка от события
   * @param eventName Название события
   * @param callback Функция-обработчик (та же, что и в `on`)
   */
  off<K extends keyof T>(eventName: K, callback: (data: T[K]) => void) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName]!.filter(
        (cb) => cb !== callback
      );
    }
  }

  /**
   * Вызов события
   * @param eventName Название события
   * @param data Данные для передачи в обработчики
   */
  emit<K extends keyof T>(eventName: K, data: T[K]) {
    if (this.listeners[eventName]) {
      this.listeners[eventName]!.forEach((callback) => callback(data));
    }
  }
}

export default LocalEventEmitter;