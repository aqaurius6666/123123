const VerifyMailTemplate = (href) => `
      <!DOCTYPE html
      PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">

      <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=320, initial-scale=1" />
      <title>Airmail Confirm</title>
      <style type="text/css">
      .logo {
            width: 685px;
            height: 68px;
            font-family: Arial;
            font-style: normal;
            font-weight: bold;
            font-size: 34px;
            line-height: 39px;
            align-items: center;
            color: #DF7020;
      }

      .content-container {
            width: 1072px;
            height: 427px;
            background: #FFFFFF;
      }

      .content-msg {
            width: 921px;
            height: 103px;
            font-family: Arial;
            font-style: normal;
            font-weight: bold;
            font-size: 34px;
            line-height: 39px;
            align-items: center;
            color: #000000;
            margin-left: auto;
            margin-right: auto;
            margin-bottom: 70px;
      }

      .verify-btn {
            width: 223px;
            height: 77px;
            background: #DF7020;
            border: 1px solid #DF7020;
            box-sizing: border-box;
            font-family: Arial;
            font-style: normal;
            font-weight: bold;
            font-size: 34px;
            line-height: 39px;
            align-items: center;
            color: #FFFFFF;
            cursor: pointer !important;
      }
      </style>
      </head>

      <body style="padding:0; margin:0; display:block; background:#F5F5F5; -webkit-text-size-adjust:none">
      <div style="width: 1153px; height: 554px; margin-left: 34px; margin-top: 20px; background: #F5F5F5;">
      <div class='logo'>ARIUM</div>
      <div class='content-container' style="padding-top: 41px; ">
            <div class='content-msg'><span style="padding-top: 41px; margin-top: 41px;">
                  Thank you for your registration to become a Arium user.
                  Please click this button to verify your email:</span></div>
            <div style="width: 100%; text-align: center;"><a href=${href}><button class='verify-btn'>Verify</button></a></div>
      </div>
      </div>
      </body>

      </html>
`

const VerifyOtpTemplate = (href) => `
      <!DOCTYPE html
      PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">

      <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=320, initial-scale=1" />
      <title>Airmail Confirm</title>
      <style type="text/css">
            .title {
                  font-family: Arial;
                  font-style: normal;
                  font-size: 34px;
                  line-height: 39px;
                  margin-bottom: 50px;
                  margin-top: 50px;
            }
            .logo {
                  width: 685px;
                  height: 68px;
                  font-family: Arial;
                  font-style: normal;
                  font-weight: bold;
                  font-size: 34px;
                  line-height: 39px;
                  align-items: center;
                  color: #DF7020;
                  padding-top: 20px;
            }

            .content-container {
                  width: 1072px;
                  height: 342px;
                  background: #FFFFFF;
            }

            .content-msg {
                  width: 921px;
                  height: 103px;
                  font-family: Arial;
                  font-style: normal;
                  font-weight: bold;
                  font-size: 34px;
                  line-height: 39px;
                  align-items: center;
                  color: #000000;
                  margin-left: auto;
                  margin-right: auto;
                  margin-bottom: 42px;
            }

            .verify-code {
                  margin-left: auto;
                  margin-right: auto;
                  font-family: Arial;
                  font-style: normal;
                  font-weight: bold;
                  font-size: 34px;
                  line-height: 39px;
                  align-items: center;
                  color: #C95C0E;
            }
      </style>
      </head>

      <body>
            <div class="title">[ARIUM] Email Authenticator Code</div>
            <div style="padding:0; margin:0; display:block; background:#F5F5F5; -webkit-text-size-adjust:none">
                  <div style="width: 1153px; height: 554px; margin-left: 34px; margin-top: 20px; background: #F5F5F5;">
                        <div class='logo'>ARIUM</div>
                        <div class='content-container' style="padding-top: 41px; ">
                              <div class='content-msg'>
                              <span style="padding-top: 41px; margin-top: 41px;">
                                    Here is your email authenticator code. This code will expire in 10 minutes:
                              </span>
                              </div>
                              <div style="width: 100%; text-align: center;"><span class='verify-code'>${href}</span></div>
                        </div>
                  </div>
            </div>
      </body>

      </html>
`
const ResetPasswordTemplate = (href) => `
      <!DOCTYPE html
      PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">

      <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=320, initial-scale=1" />
      <title>Airmail Confirm</title>
      <style type="text/css">
            .logo {
                  width: 685px;
                  height: 68px;
                  font-family: Arial;
                  font-style: normal;
                  font-weight: bold;
                  font-size: 34px;
                  line-height: 39px;
                  align-items: center;
                  color: #DF7020;
            }

            .content-container {
                  width: 1072px;
                  height: 342px;
                  background: #FFFFFF;
            }

            .content-msg {
                  width: 921px;
                  height: 103px;
                  font-family: Arial;
                  font-style: normal;
                  font-weight: bold;
                  font-size: 34px;
                  line-height: 39px;
                  align-items: center;
                  color: #000000;
                  margin-left: auto;
                  margin-right: auto;
                  margin-bottom: 42px;
            }

            .reset-btn {
                  font-family: Arial;
                  font-style: normal;
                  font-weight: bold;
                  font-size: 34px;
                  line-height: 39px;
                  align-items: center;
                  color: #FFFFFF;
                  width: 433px;
                  height: 77px;
                  left: 436px;
                  top: 467px;
                  background: #DF7020;
                  border: 1px solid #DF7020;
                  cursor: pointer !important;
                  box-sizing: border-box;
            }
      </style>
      </head>

      <body style="padding:0; margin:0; display:block; background:#F5F5F5; -webkit-text-size-adjust:none">
      <div style="width: 1153px; height: 554px; margin-left: 34px; margin-top: 20px; background: #F5F5F5;">
            <div class='logo'>ARIUM</div>
            <div class='content-container' style="padding-top: 41px; ">
                  <div class='content-msg'>
                  <span style="padding-top: 41px; margin-top: 41px;">
                        Please click this button to reset your password. This email will expire in 5 minutes.
                  </span>
                  </div>
                  <div style="width: 100%; text-align: center;"><a href=${href}><button class='reset-btn'>Reset password</button></a></div>
            </div>
      </div>
      </body>

      </html>
`
module.exports = { VerifyMailTemplate, ResetPasswordTemplate, VerifyOtpTemplate };