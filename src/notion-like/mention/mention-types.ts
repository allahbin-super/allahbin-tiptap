export type MentionSuggestionItem = {
  /** 业务侧唯一 ID（如 userId） */
  id: string;
  /** 展示名 */
  label: string;
  /** 头像 URL（可选） */
  avatar?: string;
  /** 副标题（可选，如部门） */
  subtext?: string;
};

export type MentionItemsContext = {
  query: string;
};

export type MentionItemsResolver =
  | MentionSuggestionItem[]
  | ((
      ctx: MentionItemsContext
    ) => MentionSuggestionItem[] | Promise<MentionSuggestionItem[]>);
