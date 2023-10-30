type TranslateOptions = {
  messages?: Record<string, string>;
};

type TranslateRequest = {
  key: string;
};

export type TranslateFunction = {
  (request: TranslateRequest): string;
};

export const newTranslate = ({
  messages,
}: TranslateOptions): TranslateFunction => {
  return ({ key }: TranslateRequest) => {
    if (!messages) {
      return key;
    }

    if (Object.keys(messages).length === 0) {
      return key;
    }

    if (messages.hasOwnProperty(key)) {
      return messages[key];
    }

    return key;
  };
};
