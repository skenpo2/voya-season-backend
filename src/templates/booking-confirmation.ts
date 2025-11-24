interface BookingDate {
  date: string | Date;
  time: string;
}

export interface BookingDetails {
  customerFirstName: string;
  bookingId: string;
  carModel: string;
  pickupAddress: string;
  dates: BookingDate[];
  notes?: string;
}

export const generateBookingEmail = (data: BookingDetails): string => {
  const formattedSchedule = data.dates
    .map((item) => {
      const dateStr = new Date(item.date).toDateString(); // e.g., "Mon Nov 25 2024"
      return `<div style="margin-bottom: 4px;">📅 ${dateStr} &nbsp;  ${item.time}</div>`;
    })
    .join('');

  const bookingDetailsHtml = `
    <tr>
      <td style="padding: 40px 30px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
          <tr>
            <td style="padding-bottom: 20px;">
              <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333333; font-family: 'General Sans', Arial, sans-serif;">
                Hi ${data.customerFirstName},
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #666666; font-family: 'General Sans', Arial, sans-serif;">
                Your Daily Driver Service booking for <strong>${
                  data.carModel
                }</strong> has been confirmed. Below are the details for your request:
              </p>
              
              <table width="100%" style="border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; color: #666;"><strong>Booking ID:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; text-align: right;">${
                    data.bookingId
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; color: #666;"><strong>Service Type:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; text-align: right;">Daily Driver – 12-Hour Personal Driver Service</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; color: #666;"><strong>Car:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; text-align: right;">${
                    data.carModel
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; color: #666;"><strong>Pickup Address:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; text-align: right;">${
                    data.pickupAddress
                  }</td>
                </tr>
                
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; color: #666; vertical-align: top;"><strong>Schedule:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; text-align: right; color: #333;">
                    ${formattedSchedule}
                  </td>
                </tr>

                 <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; color: #666;"><strong>Additional Notes:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eeeeee; text-align: right;">${
                    data.notes || 'None'
                  }</td>
                </tr>
              </table>

              <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #666666; font-family: 'General Sans', Arial, sans-serif;">
                Your assigned driver profile and full day schedule will be shared with you shortly.
              </p>
              
               <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; color: #666666; font-family: 'General Sans', Arial, sans-serif;">
                For immediate assistance or urgent updates, you can reach our VOYA Support team on WhatsApp: <br/>
                <a href="https://wa.me/2348149696918" style="color: #4D93FF; text-decoration: none;">+234 814 969 6918</a>
              </p>

              <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.6; color: #666666; font-family: 'General Sans', Arial, sans-serif;">
                Thank you for choosing VOYA to support your mobility, movement, and comfort across Lagos.
              </p>
              
              <p style="margin: 20px 0 0 0; font-size: 16px; line-height: 1.6; color: #666666; font-family: 'General Sans', Arial, sans-serif;">
                Warm regards,<br/>
                <strong>VOYA Operations Team</strong><br/>
                Concierge for the Continent<br/>
                <a href="mailto:support@voyaapp.co" style="color: #666; text-decoration: none;">support@voyaapp.co</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;

  // Return the full wrapper (same as before, just injecting the new body)
  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>VOYA Booking Confirmed</title>
        <style>@import url('https://fonts.googleapis.com/css2?family=General+Sans:wght@400;600&display=swap');</style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'General Sans', Arial, sans-serif;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
            <tr>
                <td align="center" style="padding: 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; background-color: #FAFAFA">
                        <tr><td><img src="https://voya-storage-bucket.s3.amazonaws.com/7bbd1f5a-0ee4-4a37-a2fa-c5a41c435ca4-email-banner.png" alt="VOYA" width="600" style="display: block; width: 100%; max-width: 600px; height: auto;" /></td></tr>
                        ${bookingDetailsHtml}
                        <tr><td style="background-image: url('https://graph.voyaapp.co/mail_footer.png'); background-size: cover; background-position: center; height: 150px;"></td></tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;
};
