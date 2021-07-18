const webpush = require('web-push');

webpush.setGCMAPIKey("AAAAkh4Ywsk:APA91bEEZAlfMkXiC02SNpyJn_alK-YALOWyZca4ijVe6uPvnPbHrTmdWoWAGUjGIaqgY0jwMkppKTjsWtxJtxRQwoh8ItoYSyLCaSaEQamnnzWQjs0swO3qzfOB0VacfV26x6SOaERw9C6J7DQtkcoyTtK0TXZnog");
webpush.setVapidDetails(
  'mailto:example@yourdomain.org',
  "BFuEzfLArTeOYWVKHoGnTFNYx_Wy8QdEZqUDtjFfkFh0Sj17pnWeBn79DksHp7eq-8Zqoeixd-uQzLtDNQYmhaQ",
  "-Hz6M61UjOf_fmYHx9UdXkrEqR0o4VlSVMsQU6bN4vo",
);

// This is the same output of calling JSON.stringify on a PushSubscription
const pushSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/eGbAIrlNoLI:APA91bH1315Yw_CnkOgMCrYTDYW4LXe1cyl2GjmtqYd_LJ49UNgnnLtV7u3Xkqmo2YcrEjs0YFxl5jXpOG5ewwGefaxhqMM_OHDyXAkmkRDt5tu7bcLHylkTi4h9SK4m_0STHSRSNciZ',
  keys: {
    auth: 'oH4eipqYS1DjiMkqVUaF5Q',
    p256dh: 'BFYboPcC8jg9FiqQqw9bH5EJbBZd22QoIC__9HvSBZ-pSLcTBxP-WpO0H5HpWZgfH7VO72Gcl_WYUO8YzlcmMHU',
  },
};

const pushSubscription2 = {
  endpoint: "https://fcm.googleapis.com/fcm/send/f5SSyE1xg2w:APA91bHPsitUW4ML-4UByA7dCwLDPHNhPgtov9os584EG7eOnXRHxSz2lvkreIIko9SukxjqgcHQQDdSP2heBGFhy0CtDea9m_LupnnNV632zvCHeFrqcSWu7OswTm1dyH1GtxU6Ewp6",
  "keys":{"p256dh":"BFjFIklcbAC2OjEkEFSQ3Z28YkE-cVy7Lce2LTOcIPD-Vt_Usi-71KSq07FCTqruVfS6kBN9kvbbCRzQEiNCWcg","auth":"jy8BNvMUI4P2lgVfrNbWhA"},
}

webpush.sendNotification(pushSubscription2, 'Your Push Payload Text');