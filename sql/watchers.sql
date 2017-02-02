SELECT 
    *
FROM
    watchers
WHERE
    CASE
        WHEN
            run_unit = 'MINUTE'
        THEN
            DATE_FORMAT(last_updated, '%Y-%m-%d %H:%i') < DATE_FORMAT(NOW() - INTERVAL run_interval MINUTE,
                    '%Y-%m-%d %H:%i')
        WHEN run_unit = 'HOUR' THEN last_updated < NOW() - INTERVAL run_interval HOUR
        WHEN run_unit = 'DAY' THEN last_updated < NOW() - INTERVAL run_interval DAY
        WHEN run_unit = 'WEEK' THEN last_updated < NOW() - INTERVAL run_interval WEEK
        WHEN run_unit = 'MONTH' THEN last_updated < NOW() - INTERVAL run_interval MONTH
    END
        AND active = 1