# nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY data.html /usr/share/nginx/html/data.html
COPY docs.html /usr/share/nginx/html/docs.html
COPY contact.html /usr/share/nginx/html/contact.html
COPY app.js /usr/share/nginx/html/app.js
COPY style.css /usr/share/nginx/html/style.css
COPY ecoseek-logo.svg /usr/share/nginx/html/ecoseek-logo.svg
COPY favicon.svg /usr/share/nginx/html/favicon.svg
EXPOSE 80