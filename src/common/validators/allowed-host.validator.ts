import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

// 解析白名单字符串（逗号分隔），统一为小写 host 列表。
function parseAllowList(value: string | undefined) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

// 校验 Agent URL 的 host 是否在白名单中（白名单为空则放行）。
export function IsAllowedAgentHost(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isAllowedAgentHost',
      target: target.constructor,
      propertyName: propertyName.toString(),
      options: validationOptions,
      validator: {
        // 校验 URL 并匹配 host 白名单。
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          let host: string;
          try {
            const url = new URL(value);
            host = url.host.toLowerCase();
          } catch {
            return false;
          }

          const allowList = parseAllowList(process.env.ALLOWED_AGENT_HOSTS);
          if (allowList.length === 0) {
            return true;
          }

          return allowList.includes(host);
        },
        // 默认错误提示。
        defaultMessage(args: ValidationArguments) {
          return `${args.property} 域名不在白名单中`;
        },
      },
    });
  };
}
