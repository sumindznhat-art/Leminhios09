FROM php:8.1-apache

# Cài extension PDO MySQL
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Bật mod_rewrite
RUN a2enmod rewrite headers

# Copy code vào web root
COPY . /var/www/html/

# Cấu hình Apache cho phép .htaccess + CORS
RUN echo '<Directory /var/www/html>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf

# Cấu hình upload file size lớn
RUN echo 'upload_max_filesize = 10M\n\
post_max_size = 10M\n\
memory_limit = 256M\n\
max_execution_time = 300' > /usr/local/etc/php/conf.d/uploads.ini

EXPOSE 80

CMD ["apache2-foreground"]
