import { describe, it, expect } from 'vitest';
import { getEmailDomainError } from '../src/utils/emailDomain.js';

const dnsError = (code) => async () => { throw Object.assign(new Error(code), { code }); };

describe('getEmailDomainError', () => {
  it('accepts a domain with mail servers', async () => {
    const lookup = async () => [{ exchange: 'gmail-smtp-in.l.google.com', priority: 5 }];
    expect(await getEmailDomainError('someone@gmail.com', lookup)).toBeNull();
  });

  it('looks up the part after the @, in lower case', async () => {
    let asked;
    const lookup = async (domain) => { asked = domain; return [{ exchange: 'mx.yahoo.com', priority: 1 }]; };
    await getEmailDomainError('Someone@Yahoo.COM', lookup);
    expect(asked).toBe('yahoo.com');
  });

  it('rejects a domain that does not exist', async () => {
    expect(await getEmailDomainError('someone@gmial.con', dnsError('ENOTFOUND'))).toMatch(/can't receive email/);
  });

  it('rejects a domain with no mail servers', async () => {
    expect(await getEmailDomainError('someone@example.org', dnsError('ENODATA'))).toMatch(/can't receive email/);
    expect(await getEmailDomainError('someone@example.org', async () => [])).toMatch(/can't receive email/);
  });

  it('rejects a domain that declares it accepts no mail', async () => {
    const lookup = async () => [{ exchange: '', priority: 0 }];
    expect(await getEmailDomainError('someone@example.com', lookup)).toMatch(/can't receive email/);
  });

  it('lets the address through when DNS itself is unavailable', async () => {
    expect(await getEmailDomainError('someone@gmail.com', dnsError('ESERVFAIL'))).toBeNull();
    expect(await getEmailDomainError('someone@gmail.com', dnsError('ETIMEOUT'))).toBeNull();
  });
});
