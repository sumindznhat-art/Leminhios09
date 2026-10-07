FROM php:8.1-apache

# Cài extension PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Bật mod_rewrite
RUN a2enmod rewrite

# Copy code vào web root
COPY . /var/www/html/

# Cấp quyền cho Apache
RUN chown -R www-data:www-data /var/www/html

# Cấu hình Apache cho phép .htaccess
RUN echo '<Directory /var/www/html>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf

# Tăng upload size
RUN echo "upload_max_filesize = 20M" > /usr/local/etc/php/conf.d/uploads.ini && \
    echo "post_max_size = 20M" >> /usr/local/etc/php/conf.d/uploads.ini && \
    echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/uploads.ini && \
    echo "max_execution_time = 300" >> /usr/local/etc/php/conf.d/uploads.ini

# Script tự đổi port theo biến $PORT của Railway
RUN printf '#!/bin/bash\n\
PORT=${PORT:-80}\n\
echo "Starting Apache on port $PORT"\n\
sed -i "s/Listen 80/Listen $PORT/g" /etc/apache2/ports.conf\n\
sed -i "s/:80/:$PORT/g" /etc/apache2/sites-available/000-default.conf\n\
apache2-foreground\n' > /start.sh && chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
