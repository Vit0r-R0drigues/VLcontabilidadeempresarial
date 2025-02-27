// Implementar Web Vitals tracking
import {onCLS, onFID, onLCP} from 'web-vitals';

function sendToAnalytics({name, delta, id}) {
  const body = JSON.stringify({name, delta, id});
  navigator.sendBeacon('/analytics', body);
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics); 