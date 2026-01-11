import { IsUrl, validateSync } from 'class-validator';
import { IsAllowedAgentHost } from './allowed-host.validator';

class TestDto {
  @IsUrl()
  @IsAllowedAgentHost()
  url!: string;
}

describe('IsAllowedAgentHost', () => {
  const envKey = 'ALLOWED_AGENT_HOSTS';

  beforeEach(() => {
    delete process.env[envKey];
  });

  it('白名单为空时应放行', () => {
    const dto = new TestDto();
    dto.url = 'https://agent.example.com/run';
    const errors = validateSync(dto);
    expect(errors.length).toBe(0);
  });

  it('白名单命中时应放行', () => {
    process.env[envKey] = 'agent.example.com,api.agent.local';
    const dto = new TestDto();
    dto.url = 'https://agent.example.com/run';
    const errors = validateSync(dto);
    expect(errors.length).toBe(0);
  });

  it('白名单不命中时应拒绝', () => {
    process.env[envKey] = 'agent.example.com';
    const dto = new TestDto();
    dto.url = 'https://evil.example.com/run';
    const errors = validateSync(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
