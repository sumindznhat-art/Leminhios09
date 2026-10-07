FROM php:8.1-apache

RUN docker-php-ext-install pdo pdo_mysql mysqli

RUN a2enmod rewrite

COPY . /var/www/html/

RUN chown -R www-data:www-data /var/www/html

RUN echo "upload_max_filesize = 20M" > /usr/local/etc/php/conf.d/uploads.ini && \
    echo "post_max_size = 20M" >> /usr/local/etc/php/conf.d/uploads.ini && \
    echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/uploads.ini

RUN printf '#!/bin/bash\nPORT=${PORT:-80}\necho "Apache starting on port $PORT"\nsed -i "s/Listen 80/Listen $PORT/g" /etc/apache2/ports.conf\nsed -i "s/:80/:$PORT/g" /etc/apache2/sites-available/000-default.conf\napache2-foreground\n' > /start.sh && chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
