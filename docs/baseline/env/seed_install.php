<?php
/*
 * OpenCATS Phase 0.5 baseline — ENVIRONMENT-ONLY database seeding script.
 * NOT part of the application; never copied into the application directory.
 *
 * Replays, from the command line, the database steps the web installer performs
 * (modules/install/ajax/ui.php), using the repository's own SQL files and the same
 * statement-splitting rules. It deliberately does NOT replay any
 * CATSUtility::changeConfigSetting() call, so config.php is never rewritten.
 *
 * Run inside the php container with the application root as working directory:
 *   php /baseline-env/seed_install.php empty      -> doInstallEmptyDatabase
 *   (then one HTTP GET of index.php, which runs the pending module schema migrations,
 *    as the installer's "maint" step does through ajax.php?f=install:maint)
 *   php /baseline-env/seed_install.php finalize   -> maintComplete (settings, date format, time zone)
 *   php /baseline-env/seed_install.php demo <path-to-db/catsbackup.sql.0>
 *                                                 -> onLoadDemoData + upgradeCats.
 *      NOTE: on PHP 7.2 the demo path leaves the application unusable (schema migration 225
 *      calls mysql_real_escape_string()); see docs/baseline/KNOWN_RUNTIME_ERRORS.md RT-01.
 *
 * Like the installer's MySQLQuery(), SQL errors do not stop the run; unlike it, they are printed.
 */

/* Command line only. This file lives inside the repository, which is also the web root of a
 * normal OpenCATS install, so refuse to run when requested over HTTP. */
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$mode = isset($argv[1]) ? $argv[1] : '';
$db = mysqli_connect('localhost', 'cats', 'password', 'cats_dev');
if (!$db) { fwrite(STDERR, 'connect failed: ' . mysqli_connect_error() . "\n"); exit(1); }

function runMultiple($db, $label, $sql, $delimiter)
{
    $ok = 0; $err = 0;
    foreach (explode($delimiter, $sql) as $stmt) {
        $stmt = trim($stmt);
        if ($stmt === '') continue;
        if (mysqli_query($db, $stmt)) { $ok++; continue; }
        $err++;
        printf("  [%s] SQL ERROR %d %s :: %s\n", $label, mysqli_errno($db), mysqli_error($db),
            substr(preg_replace('/\s+/', ' ', $stmt), 0, 160));
    }
    printf("%-30s ok=%d errors=%d\n", $label, $ok, $err);
}

function tables($db)
{
    $t = array();
    $rs = mysqli_query($db, 'SHOW TABLES');
    while ($r = mysqli_fetch_row($rs)) $t[$r[0]] = true;
    return $t;
}

switch ($mode) {
    case 'empty':
        /* ui.php case 'doInstallEmptyDatabase' */
        runMultiple($db, 'db/cats_schema.sql', file_get_contents('db/cats_schema.sql'), ";\n");
        $tables = tables($db);
        if (!isset($tables['history'])) {
            runMultiple($db, 'db/upgrade-0.6.x-0.7.0.sql', file_get_contents('db/upgrade-0.6.x-0.7.0.sql'), ';');
        } else {
            echo "history table present -> db/upgrade-0.6.x-0.7.0.sql skipped (same as installer)\n";
        }
        break;

    case 'demo':
        /* ui.php case 'onLoadDemoData' (SQL part; attachment files are copied by the caller) */
        runMultiple($db, 'demo catsbackup.sql.0', file_get_contents($argv[2]), '((ENDOFQUERY))');
        /* ui.php case 'upgradeCats' */
        $tables = tables($db);
        $fields = array();
        $rs = mysqli_query($db, 'SELECT * FROM candidate');
        while ($meta = mysqli_fetch_field($rs)) $fields[$meta->name] = true;
        if (!isset($fields['date_available'])) $revision = 50;
        else if (!isset($tables['candidate_joborder_status'])) $revision = 52;
        else if (!isset($tables['candidate_foreign']) && !isset($tables['extra_field'])) $revision = 55;
        else if (!isset($tables['history'])) $revision = 60;
        else if (!isset($tables['candidate_duplicates'])) $revision = 94;
        else $revision = 95;
        echo "detected revision = $revision\n";
        if ($revision <= 50) runMultiple($db, 'upgrade-0.5.0-0.5.1.sql', file_get_contents('db/upgrade-0.5.0-0.5.1.sql'), ';');
        if ($revision <= 52) runMultiple($db, 'upgrade-0.5.2-0.5.5.sql', file_get_contents('db/upgrade-0.5.2-0.5.5.sql'), ';');
        if ($revision <= 55) runMultiple($db, 'upgrade-0.5.5-0.6.x.sql', file_get_contents('db/upgrade-0.5.5-0.6.x.sql'), ';');
        if ($revision <= 60) runMultiple($db, 'upgrade-0.6.x-0.7.0.sql', file_get_contents('db/upgrade-0.6.x-0.7.0.sql'), ';');
        if ($revision <= 94) runMultiple($db, 'upgrade-0.9.4-0.9.5.sql', file_get_contents('db/upgrade-0.9.4-0.9.5.sql'), ';');
        runMultiple($db, 'upgrade-zipcodes.sql', (string) @file_get_contents('db/upgrade-zipcodes.sql'), ';');
        break;

    case 'finalize':
        /* ui.php case 'maintComplete' — values an operator would type in the wizard (test values). */
        $fromAddress = 'noreply@baseline.example.test';
        mysqli_query($db, sprintf('UPDATE settings SET value = "%s" WHERE setting = "fromAddress"', $fromAddress));
        if (mysqli_affected_rows($db) <= 0) {
            runMultiple($db, 'settings fromAddress/configured',
                'INSERT INTO settings (setting, value, site_id, settings_type) SELECT "fromAddress", "' . $fromAddress . '", site_id, 1 FROM site;'
                . 'INSERT INTO settings (setting, value, site_id, settings_type) SELECT "configured", "1", site_id, 1 FROM site', ';');
        } else {
            echo "settings fromAddress updated (rows already existed)\n";
        }
        /* date format "mdy" (installer default) and time zone = OFFSET_GMT from the tracked config.php (2) */
        runMultiple($db, 'site date format/time zone', 'UPDATE site SET date_format_ddmmyy = 0;UPDATE site SET time_zone = 2', ';');
        break;

    default:
        fwrite(STDERR, "usage: seed_install.php empty|finalize|demo <sqlfile>\n");
        exit(2);
}
