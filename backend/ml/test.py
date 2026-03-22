from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
import traceback

X, y = [[1]], [1]
rf = RandomForestClassifier().fit(X, y)
try:
    c = CalibratedClassifierCV(estimator=rf, cv='prefit')
    c.fit(X, y)
    with open('out.txt', 'w') as f:
        f.write("SUCCESS\n")
except Exception as e:
    with open('out.txt', 'w') as f:
        traceback.print_exc(file=f)
