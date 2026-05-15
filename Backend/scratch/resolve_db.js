const dns = require('dns');

const host = 'aws-1-ap-southeast-2.pooler.supabase.com';

dns.setServers(['8.8.8.8']);

dns.resolve(host, 'A', (err, addresses) => {
  if (err) {
    console.error('IPv4 resolution failed:', err);
  } else {
    console.log('IPv4 addresses:', addresses);
  }
});

dns.resolve(host, 'AAAA', (err, addresses) => {
  if (err) {
    console.error('IPv6 resolution failed:', err);
  } else {
    console.log('IPv6 addresses:', addresses);
  }
});
