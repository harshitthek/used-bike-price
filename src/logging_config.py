import logging
import sys

try:
    from pythonjsonlogger import jsonlogger
    HAS_JSON_LOGGER = True
except ImportError:
    HAS_JSON_LOGGER = False

try:
    from asgi_correlation_id import correlation_id
    HAS_CORRELATION_ID = True
except ImportError:
    HAS_CORRELATION_ID = False


if HAS_JSON_LOGGER:
    class CorrelationJsonFormatter(jsonlogger.JsonFormatter):
        def add_fields(self, log_record, record, message_dict):
            super().add_fields(log_record, record, message_dict)
            
            # Ensure timestamp and level are present
            if not log_record.get('timestamp'):
                log_record['timestamp'] = self.formatTime(record, self.datefmt)
            if log_record.get('level'):
                log_record['level'] = log_record['level'].upper()
            else:
                log_record['level'] = record.levelname

            # Inject request_id
            if HAS_CORRELATION_ID:
                req_id = correlation_id.get()
                if req_id:
                    log_record['request_id'] = req_id
                
            # Optional event type (defaults to standard log if not provided)
            if not log_record.get('event'):
                log_record['event'] = 'app_log'


def setup_logging():
    logger = logging.getLogger()
    
    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
        
    handler = logging.StreamHandler(sys.stdout)
    
    if HAS_JSON_LOGGER:
        formatter = CorrelationJsonFormatter(
            '%(timestamp)s %(level)s %(message)s',
            rename_fields={'levelname': 'level', 'asctime': 'timestamp'}
        )
    else:
        # Fallback for environments without python-json-logger
        formatter = logging.Formatter(
            '%(asctime)s %(levelname)s [%(name)s] %(message)s'
        )
        
    handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    
    # Set uvicorn loggers to use this format
    for logger_name in ["uvicorn", "uvicorn.access", "uvicorn.error", "fastapi"]:
        uv_logger = logging.getLogger(logger_name)
        uv_logger.handlers = [handler]
        uv_logger.setLevel(logging.INFO)
        uv_logger.propagate = False
